# Deploy no VPS com Coolify

Uma única imagem Docker (o `Dockerfile` na raiz) serve dois serviços; a variável `SERVICE`
escolhe o modo. No Coolify você cria **duas aplicações** apontando para o mesmo repositório:

| aplicação | `SERVICE` | o que faz | domínio sugerido |
| --- | --- | --- | --- |
| `videos-studio` | `studio` | Remotion Studio atrás do Caddy com usuário e senha | `studio.seu-dominio.com` |
| `videos-api` | `api` | API de render com fila serial e mp4 num volume | `render.seu-dominio.com` |

Requisitos: Coolify v4, VPS com 4 GB e 2 vCPU (ou mais), repositório GitHub conectado ao
Coolify (GitHub App ou chave de deploy) e o branch com o `Dockerfile` (por exemplo `main`
depois do merge). O VPS precisa de saída para a internet: a imagem baixa o Chrome na build e as
fontes do Google são carregadas em tempo de execução.

## 1. Aplicação `videos-studio`

1. Projects → seu projeto → **New Resource** → **Application** → repositório do GitHub
   (`jorguzz-fer/remotion`), branch `main`.
2. **Build Pack**: `Dockerfile`. **Dockerfile Location**: `/Dockerfile`. **Base Directory**: `/`.
3. **Ports Exposes**: `3000`.
4. **Environment Variables**:
   - `SERVICE=studio`
   - `STUDIO_USER=<seu usuário>`
   - `STUDIO_PASSWORD=<senha forte>`
5. **Domain**: `https://studio.seu-dominio.com` (registro A do DNS apontando para o VPS; o Coolify
   emite o certificado).
6. **Health Check**: path `/healthz`, porta `3000`.
7. **Advanced → Resource limits**: limite de memória `1536` MB.
8. **Deploy**. A primeira build leva alguns minutos (apt, `npm ci`, download do Chrome, bundle).
9. Teste: abra o domínio, informe usuário e senha, e o Studio abre em `Exemplo-Vertical`.

Renders feitos pelo botão *Render* do Studio ficam em `/app/out` dentro do container e são
baixados pela própria interface. Edições do Modo Visual feitas no servidor **não persistem**
(somem no próximo deploy): o fluxo é editar local, `git push`, deploy automático.

## 2. Aplicação `videos-api`

Mesmo repositório, mesmo `Dockerfile`, mesma porta. Diferenças:

1. **Environment Variables**:
   - `SERVICE=api`
   - `RENDER_API_KEY=<chave>` (gere com `openssl rand -hex 32`)
   - `RENDER_TTL_HOURS=72` (opcional; horas até a limpeza automática dos mp4)
   - `RENDER_CONCURRENCY=1` (opcional; threads do Chrome por render)
2. **Storages → Add**: volume com destino `/app/renders` (persistente entre deploys).
3. **Health Check**: path `/health`.
4. **Domain**: `https://render.seu-dominio.com`.
5. **Resource limits**: limite de memória `1536` MB.

## 3. Deploy automático

Com o repositório conectado pela GitHub App, o Coolify já faz deploy a cada push no branch
(toggle *Auto Deploy* na aplicação). Sem a GitHub App: aplicação → **Webhooks** → copie a URL e
cadastre em GitHub → Settings → Webhooks (evento *push*, content type `application/json`).

## 4. Usar a API

```bash
API=https://render.seu-dominio.com
KEY=cole-a-chave-aqui

curl -s $API/health
curl -s -H "x-api-key: $KEY" $API/compositions
curl -s -X POST -H "x-api-key: $KEY" -H "content-type: application/json" \
  -d '{"compositionId":"Exemplo-Vertical","inputProps":{"title":"Olá"}}' $API/renders
# -> {"jobId":"...","status":"queued","statusUrl":"/renders/<id>","downloadUrl":"/renders/<id>/download"}
curl -s -H "x-api-key: $KEY" $API/renders/<id>
curl -H "x-api-key: $KEY" -o video.mp4 $API/renders/<id>/download
curl -X DELETE -H "x-api-key: $KEY" $API/renders/<id>
```

Códigos: `202` job criado, `400` corpo inválido, `401` sem chave, `404` job inexistente,
`409` render não concluído (ou job não cancelável), `410` arquivo já removido pela limpeza.
`inputProps` são mesclados sobre os `defaultProps` da composition (validados pelo schema zod).

No n8n: nó *HTTP Request* com o header `x-api-key`, POST em `/renders`, depois um loop de
espera consultando `statusUrl` a cada 5 s até `status = completed`, e por fim o download.

## 5. Limites e cuidados

- A fila é serial: um render por vez em cada aplicação. Com 4 GB, evite renders simultâneos no
  Studio e na API.
- A lista de jobs fica em memória: reiniciar o container zera a lista, mas os mp4 continuam no volume.
- `npm run voiceover` e `npm run transcribe` rodam só na sua máquina (voz do macOS e Whisper local).
  O servidor renderiza o que está commitado, incluindo os mp3 e os JSON de legendas.
- A senha do Studio é Basic Auth pelo Caddy dentro do container. Se preferir a senha no proxy do
  Coolify, veja a documentação de Basic Auth do Traefik do Coolify; não é necessário fazer as duas.

## 6. Solução de problemas

- Build falha em `npx remotion browser ensure` ou no `apt-get`: o VPS está sem acesso à internet.
- `502` no Studio logo depois do deploy: o Studio interno ainda está compilando (30 a 60 s).
- Container reiniciando ou render morrendo sem erro: memória. Suba o limite ou defina
  `RENDER_CONCURRENCY=1`.
- Studio abre preto e o console mostra `$RefreshSig$ is not defined`: alguém definiu `NODE_ENV=production`
  na aplicação do Studio. Remova a variável; o entrypoint já cuida do `NODE_ENV` de cada modo.
- Studio mostra "Legendas não encontradas" e erros de `fetch` mencionando credenciais: a URL foi aberta
  com `usuario:senha@` embutidos. Abra o domínio sem credenciais e informe usuário e senha no diálogo.
- Logs: Coolify → aplicação → *Logs*. No servidor, `docker logs <container>`.
- Testar a imagem localmente antes do deploy:

```bash
docker build -t videos:local .
docker run --rm -e SERVICE=api -e RENDER_API_KEY=teste -p 3100:3000 -v "$PWD/renders:/app/renders" videos:local
docker run --rm -e SERVICE=studio -e STUDIO_USER=eu -e STUDIO_PASSWORD=segredo -p 3200:3000 videos:local
```
