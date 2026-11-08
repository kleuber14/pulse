# PULSE — Circuitos

**Gire. Conecte. Deixe fluir.**

Puzzle HTML5 completo, em Vite, JavaScript, SVG e CSS. A mecânica desta versão é girar peças para formar uma rede de energia conectada. A identidade visual é própria. Não há contas, anúncios ou analytics. O jogo está no GitHub Pages; o ranking usa uma pequena API Sites com banco D1. A logo do criador é um arquivo local.

Jogar: https://kleuber14.github.io/pulse/

Código: https://github.com/kleuber14/pulse

## Executar

Use Node.js 24 LTS e npm:

```sh
cd /workspace/pulse
npm ci
npm run dev
```

Abra a URL exibida pelo Vite. Para acessar pelo Android na mesma rede, use o endereço de rede exibido e deixe o servidor acessível ao dispositivo.

```sh
npm test
npm run build
npm run preview
```

O build está em `dist/`, usa caminhos relativos e funciona em hospedagem estática, inclusive sob `/pulse/`. Não abra `index.html` por `file://`: use o servidor do Vite ou a hospedagem.

## Como jogar

O gerador verde é fixo. Cada toque em outra peça gira seus fios em 90 graus no sentido horário. A energia passa entre peças com pontas que se encontram; apenas as peças conectadas ao gerador ficam acesas. Para concluir, conecte todos os núcleos e feche todas as pontas dos fios.

As fases 1, 2 e 3 têm tutoriais visuais, respectivamente com soluções de 1, 2 e 3 giros. Uma moldura destaca a próxima peça e a orientação acompanha o estado atual, mesmo após um erro ou desfazer. Os textos explicam o gerador, as conexões e a conclusão da rede. A partir da fase 4, o jogador explora livremente.

O início oferece **Jogar com som**, que habilita o áudio dentro do gesto do usuário exigido pelos navegadores, ou **Prefiro jogar sem som**. Há um controle visível de som durante a partida e nas configurações. Os efeitos de giros e vitória são sintetizados com Web Audio; não há música comercial. As preferências de som e movimento são salvas. A preferência de movimento reduzido do dispositivo prevalece.

Há 50 circuitos em cinco capítulos de dez fases: **Conexão**, **Circuitos**, **Fluxo**, **Ressonância** e **Harmonia**. Os primeiros dez usam 3×3 e os demais 4×4. Capítulos posteriores acrescentam laços à rede e mais peças desalinhadas. Não há cronômetro ou punição por tentar. Desfazer restaura os fios e a orientação exatos.

A dica primeiro explica como a energia flui; solicitações seguintes apontam um giro de uma solução mínima do estado atual. Ouro corresponde à referência ideal, prata até ideal + 3 giros e bronze acima disso. Há desafio diário determinístico por data local e melhor resultado salvo neste navegador, sem ranking global.

No teclado, Tab entra no tabuleiro, setas navegam e Enter ou espaço giram. Os controles têm foco visível e etiquetas com posição e estado de energia.

## Motor e validação

`engine.js` usa quatro bits por peça: norte, leste, sul e oeste. Girar preserva a forma; quatro giros restauram a peça. O motor de energia faz busca em largura a partir do gerador, verificando pontas recíprocas. A vitória exige todos conectados e nenhuma ponta solta, inclusive nas bordas.

As fases partem de redes conectadas geradas com sementes fixas; depois algumas peças são giradas. Fases iniciais usam um caminho cuidadosamente escolhido. As demais usam árvores conectadas e, nos capítulos seguintes, laços adicionais. Nenhuma fase começa concluída.

O solver combina restrições de bordas, correspondência de pontas, consistência de arcos e busca com poda pelo menor número de giros. Também exige conexão ao gerador: um laço desconectado não conta como vitória. A solução conhecida fornece um limite inicial e garante um caminho válido. Os testes comparam o mínimo calculado com enumeração independente em tabuleiros pequenos.

A trava de interação durante a rotação e o identificador de sessão impedem que toques repetidos ou animações antigas alterem outra fase.

## Arquivos

- `src/engine.js`: rotação, propagação, solver, fases, diário e medalhas.
- `src/tutorial.js`: orientação das três primeiras fases.
- `src/main.js`: telas, controle da partida, SVG, dicas e compartilhamento.
- `src/style.css`: identidade visual, circuitos, responsividade e animações.
- `src/audio.js`: síntese de áudio e controle de silêncio.
- `src/storage.js`: progresso e preferências.
- `test/`: testes do motor, tutorial na interface, áudio e armazenamento.
- `.github/workflows/pages.yml`: testes, build e publicação automática.

A nova mecânica usa a chave `pulse-circuits-v2` no localStorage. Os resultados antigos de alternância de núcleos continuam intactos em `pulse-v1`; somente as preferências antigas são aproveitadas, pois aquelas fases são diferentes. A jornada de circuitos começa no tutorial.

## Publicar no GitHub Pages

O workflow já está configurado. Em **Settings → Pages → Source**, selecione **GitHub Actions**. Cada push em `main` instala dependências, roda os testes, gera `dist/` e publica o resultado. Também é possível iniciar o workflow manualmente em Actions.

Para usar outro repositório, copie o conteúdo desta pasta para a raiz, incluindo o workflow e o lockfile. Se mantiver a subpasta `pulse/` em um repositório maior, copie `.github/workflows/pages.yml` para `.github/workflows/` na raiz; ele detecta a subpasta automaticamente.

## Verificação e limites

A suíte verifica as soluções das 50 fases, 366 desafios diários, correspondência de conexões, bordas, gerador fixo, reversibilidade, solução mínima por enumeração independente, progresso, ativação de áudio, tutorial, teclado, 50 vitórias completas e condições de concorrência.

Os testes de interface usam DOM simulado; os de áudio usam um contexto instrumentado. O ambiente não disponibilizou a ferramenta exigida para inspeção visual em navegador real. Renderização CSS, saída sonora física e experiência em Android precisam de conferência no dispositivo.

Web Share é usado quando disponível, com alternativa de copiar e texto selecionável. Algumas APIs dependem de HTTPS ou localhost. Progresso não sincroniza entre dispositivos. Limpar os dados do navegador apaga os resultados. O desafio diário pode reutilizar padrões em datas diferentes.

## Versão mobile, créditos e recordes

A entrada foi reduzida a título, uma instrução, botões grandes e top 3. No celular, a arte decorativa e os rótulos repetidos são omitidos. Textos principais usam 16–18 px e controles têm pelo menos 44–48 px. A partida mantém a dica curta junto ao tabuleiro e evita referências pequenas no topo.

A abertura de Kleuber Avila dura 2,3 segundos, pode ser pulada e aparece uma vez por sessão da aba. A logo anexada foi preparada como asset transparente. Confetes são feitos em CSS e desativados quando o aparelho pede movimento reduzido.

O áudio ganhou notas com mais presença em alto-falantes de celular, envelope mais forte, compressor e controle de volume. O volume físico do aparelho continua sendo controlado pelo sistema. A fanfarra de recorde é diferente do som comum de conclusão.

## Ranking online

A API está em https://pulse-ranking-kleuber14.kleuber14.chatgpt.site e usa Sites com D1. As migrações geradas e o código estão em `ranking-service/`. Não há chave administrativa no navegador. Uma identificação aleatória salva no aparelho vincula os resultados; não é necessário login. Sem conta, o mesmo jogador em aparelhos diferentes terá identificações diferentes.

A cada vitória, o servidor recebe a sequência de giros e verifica a solução. O resultado vale até 1.000 pontos por fase, proporcional à eficiência, somando apenas o melhor resultado de cada circuito. Repetições não acumulam pontos. Empates favorecem menos giros e o registro mais antigo. O diário não altera o placar geral.

Quando um resultado pode entrar no top 3, aparece um único campo de apelido opcional, de 2 a 18 caracteres. O apelido fica público. Depois do primeiro registro, os próximos resultados são atualizados sem pedir o nome novamente. O jogador pode seguir para outra fase sem participar. Se o serviço estiver indisponível, o jogo e o progresso local continuam funcionando.

Os testes usam dados temporários em SQLite, sem inserir nomes de teste no placar publicado. São 63 testes de jogo/interface e 2 testes da API. Esta é uma classificação casual: verifica partidas, mas não implementa proteção contra bots ou identidades múltiplas. A verificação física em Android e a inspeção visual real continuam pendentes neste ambiente.
