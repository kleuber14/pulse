# Métricas do PULSE (Google Analytics 4)

## Ativação
1. Crie uma propriedade GA4 em https://analytics.google.com/ e um fluxo de dados do tipo **Web**, usando `https://kleuber14.github.io/pulse/`.
2. Copie o ID de medição (formato `G-XXXXXXXXXX`).
3. No repositório GitHub: **Settings > Secrets and variables > Actions > Variables > New repository variable**.
4. Crie `VITE_GA4_MEASUREMENT_ID` com esse ID.
5. Execute o workflow **Publish PULSE to GitHub Pages** (Actions > Run workflow) após o merge do PR. A variável é aplicada no *build*, não em tempo de execução.
6. Abra o jogo, aceite o uso de métricas e confira o **Realtime** e **DebugView** da sua propriedade GA4. Bloqueadores de anúncios podem impedir a coleta.

Sem ID válido, o jogo funciona normalmente e não carrega o Google Analytics. Com o ID, a tag GA4 só é carregada após a aceitação. O jogador pode revogar o consentimento em **Configurações > Estatísticas de uso**. A coleta anterior à revogação não é excluída automaticamente.

## Eventos
- `level_start`: `level_number`, `mode` (campaign/daily)
- `level_complete`: `level_number`, `mode`, `moves`, `medal`
- `tutorial_start`, `tutorial_complete`, `tutorial_abandon`: `level_number` e, para abandono, `moves`
- `daily_challenge_start`, `daily_challenge_complete`
- `share_result`: compartilhamento concluído por Web Share API ou cópia de texto.

O número do nível diário é 0 para não registrar datas/identificadores pessoais. Não enviar apelidos do ranking, dados pessoais ou identificadores de jogador ao GA4. Para analisar os parâmetros específicos nos relatórios, configure **Definições personalizadas** no GA4.

## Retenção
Os relatórios de retenção do GA4 permitem analisar retorno nos dias seguintes, como D1 e D7, após volume suficiente de dados. A coleta não é retroativa: usuários anteriores à ativação não serão contabilizados. Configure transparência de privacidade adequada ao público e legislação aplicável.

## Validação
- `npm test`
- `npm run build`
- Testar consentimento (aceitar, recusar, reabrir Configurações), jogo normal, fases 1–3, desafio diário, compartilhamento e ranking.
