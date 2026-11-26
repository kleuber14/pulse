# PULSE no Android

O projeto Capacitor está em `android/`. Ele inclui o jogo compilado dentro do aplicativo: fases, sons e imagens não dependem do GitHub Pages. O ranking continua online no serviço existente.

- Nome: **PULSE**
- Identificador: **com.kleuberavila.pulse**
- Versão inicial: **1.0.0**, código **1**
- Android mínimo: **7.0 / API 24**
- Android alvo: **16 / API 36**
- Origem do WebView: **https://localhost**

O identificador precisa ser confirmado antes do primeiro envio à Google Play; depois ele não pode ser trocado para atualizar o mesmo app.

## Arquivos para baixar

Em **GitHub → Actions → Build PULSE Android**, execute **Run workflow**. Quando o job terminar, baixe o artefato **PULSE-Android** no final da página. Os downloads desse workflow ficam disponíveis por 30 dias e podem exigir login no GitHub.

- `PULSE-teste.apk`: instalável em Android para testar. Usa assinatura de debug. **Não é o arquivo para publicar na loja.**
- `PULSE-publicacao-sem-assinatura.aab`: pacote de lançamento compilado, **ainda sem a assinatura de upload exigida pela Google Play**.
- `PULSE-icone-512.png`: ícone da loja.

Não envie a chave de publicação, suas senhas ou um arquivo `.jks` para um repositório público. O aplicativo de teste e a futura versão da Play podem ter assinaturas diferentes; nesse caso é preciso desinstalar a versão de teste antes de instalar a versão da loja, o que apaga seus dados locais.

## Compilar no computador

Instale Node.js 24, JDK 21 e Android Studio com SDK Android 36 e Build Tools 35.0.0. Abra a pasta `android/` no Android Studio para compilar e executar. O caminho do SDK pertence somente ao arquivo local ignorado `android/local.properties`.

```sh
npm ci
npm run android:sync
npm run android:verify
npm run android:debug
npm run android:bundle
```

O primeiro comando de sincronização inclui o build web em `android/app/src/main/assets/public/`. Não configure `server.url` apontando para o site: isso faria o aplicativo depender da hospedagem para abrir as fases.

## Assinatura de publicação

O pacote AAB de lançamento só está pronto para upload após ser assinado com uma chave de upload. No Android Studio, use **Build → Generate Signed App Bundle / APK → Android App Bundle**, crie/seleciona sua chave e guarde uma cópia particular dela e da senha.

Também é possível compilar com as variáveis de ambiente `PULSE_KEYSTORE_PATH`, `PULSE_KEYSTORE_PASSWORD`, `PULSE_KEY_ALIAS` e `PULSE_KEY_PASSWORD`. As senhas não devem ser passadas em argumentos de comandos ou gravadas no Git. Sem essas variáveis, o projeto produz um AAB sem assinatura deliberadamente. A chave de debug nunca é usada para assinar a versão release.

## Integração com o aparelho

- O botão Voltar fecha a janela atual ou volta ao início do jogo; no início, minimiza o aplicativo.
- O som ativo é interrompido quando o aplicativo vai para o fundo.
- O resultado usa a tela nativa de compartilhamento do Android.
- O layout respeita barras do sistema e recortes da tela.
- O ranking aceita explicitamente a origem local HTTPS do aplicativo, mantendo as outras origens bloqueadas.
- Não são solicitadas permissões de câmera, microfone, contatos ou localização. O manifesto do app solicita internet para o ranking e as métricas existentes.

O progresso do navegador não é importado automaticamente para o aplicativo. Sem login, cada instalação tem seu próprio progresso e identificador de ranking. As métricas GA4 já existentes no projeto continuam presentes e devem ser declaradas corretamente na seção Segurança dos dados da Play.

## O que falta fora do Capacitor

Criar/verificar a conta Play Console, pagar a taxa do Google, confirmar o identificador, guardar a chave de upload, preparar/revisar a política de privacidade e as declarações de dados, testar em aparelhos físicos e cumprir o teste fechado exigido para contas pessoais novas. A Play Store faz sua própria análise: compilar o aplicativo não garante aprovação.
