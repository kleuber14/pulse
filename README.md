# PULSE

**Sinta o padrão. Descubra a lógica.**

Puzzle completo em JavaScript, Vite, CSS e SVG. Sem imagens, fontes externas, contas, backend, anúncios ou coleta de dados. O jogo funciona inteiramente no navegador.

## Executar localmente

Use Node.js **24 LTS** e npm:

```sh
cd /workspace/pulse
npm ci
npm run dev
```

Abra a URL exibida pelo Vite, normalmente `http://localhost:5173`. No Android conectado à mesma rede, use o endereço de rede exibido pelo Vite. O servidor precisa estar acessível nessa rede.

```sh
npm test          # testes de motor, persistência e interface
npm run build    # distribuição estática em dist/
npm run preview  # conferir o build localmente
```

Não abra `index.html` diretamente por `file://`: use o servidor do Vite ou publique `dist/`.

## Jogar

Toque um núcleo para alternar o conjunto afetado. A meta é acender todos. Observe os caminhos luminosos; não há cronômetro nem punição por tentar. Desfazer restaura exatamente o movimento anterior. Reiniciar restaura a fase original.

No teclado, Tab entra no tabuleiro; as setas navegam pelos núcleos; Enter ou espaço emitem um pulso. Os controles têm foco visível, etiquetas e estados acessíveis. Som começa desligado. Movimento reduzido do sistema tem prioridade sobre a preferência de animações do jogo.

A primeira dica explica a regra. As próximas apontam o primeiro movimento de uma solução mínima **do estado atual**. Dicas não fazem o movimento automaticamente. As medalhas são relativas à solução mínima inicial: ouro até o ideal; prata até ideal + 2; bronze acima disso. Progresso, melhores resultados diários e preferências ficam neste navegador.

## Regras exatas

Cada movimento alterna uma **união de conjuntos**, sem duplicar efeitos:

- **Pulso:** o próprio núcleo e vizinhos ortogonais imediatamente adjacentes.
- **Espelho:** acrescenta o correspondente horizontal do núcleo tocado (`linha, n−1−coluna`). Não replica a vizinhança inteira. Se coincidir com outro efeito, alterna uma só vez.
- **Ressonância:** acrescenta os vizinhos diagonais imediatamente adjacentes.

Fases 1–10: Pulso. Fases 11–20: Pulso + Espelho. Fases 21–23: Pulso + Ressonância. Fases 24–26: Espelho + Ressonância. Fases 27–30: as três regras. As fases introdutórias das novas combinações oferecem um exemplo animado que não altera o tabuleiro.

As seis primeiras fases usam 3×3; as demais, 4×4. As soluções mínimas progridem de 1 a 8 movimentos, com redução intencional de dificuldade na apresentação de novas regras.

## Geração e garantia de solução

`src/engine.js` percorre os estados alcançáveis por busca em largura, partindo do tabuleiro todo aceso. Cada transição é reversível: aplicar duas vezes o mesmo movimento restaura o estado anterior. A escolha de estado, distância e semente é determinística. O caminho inverso fornece a sequência conhecida de geração a partir do estado resolvido.

Nenhuma fase começa resolvida. As 30 fases são distintas. O solver armazena distâncias mínimas e a próxima ação em tabelas de até 65.536 estados. As tabelas são reutilizadas; nenhuma decisão depende de aleatoriedade. A trava de entrada durante o pulso e um identificador de sessão impedem que ações repetidas ou animações antigas alterem outro tabuleiro.

O diário usa `AAAA-MM-DD` do calendário local como semente. Para a mesma data, todos recebem o mesmo tabuleiro. O resultado é local e não constitui ranking. Datas diferentes podem reutilizar um padrão; não há promessa de unicidade infinita.

## Arquivos

- `index.html`: entrada e metadados em português.
- `src/engine.js`: regras, solver, fases, diário e medalhas.
- `src/main.js`: telas, controles, fluxo, compartilhamento e propagação SVG.
- `src/style.css`: identidade visual, responsividade, animações e movimento reduzido.
- `src/storage.js`: persistência com recuperação quando localStorage não está disponível.
- `src/audio.js`: efeitos originais sintetizados por Web Audio.
- `test/engine.test.js`: regras, reversibilidade, soluções e diário.
- `test/storage.test.js`: persistência e falhas do armazenamento.
- `test/ui.test.js`: integração da interface em DOM simulado, incluindo 30 vitórias e condições de concorrência.
- `.github/workflows/pages.yml`: pipeline de testes, build e publicação.
- `package.json` e `package-lock.json`: scripts e dependências reproduzíveis.
- `dist/`: build de produção gerado, pronto para hospedagem estática.

Happy DOM é apenas dependência de desenvolvimento; não integra o jogo publicado. Nenhuma biblioteca de interface é enviada ao navegador.

## Publicar no GitHub Pages

1. Crie um repositório e envie o conteúdo desta pasta para sua raiz, incluindo `.github/workflows/pages.yml` e `package-lock.json`.
2. Use a branch `main` (ou ajuste o filtro no workflow).
3. Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions**.
4. Faça push em `main` ou execute o workflow manualmente em **Actions**.
5. O workflow instala dependências, executa testes, gera `dist/` e publica. A URL aparece no job `deploy` e na página de configurações.

O build usa `--base=./`, portanto funciona também sob `/nome-do-repositorio/`. Não há rotas que precisem de configuração do servidor.

Se este jogo permanecer como subpasta `pulse/` em um repositório maior, copie o workflow para `.github/workflows/` **na raiz desse repositório**. Ele detecta automaticamente a subpasta. Repositório do projeto: https://github.com/kleuber14/pulse. Endereço esperado do GitHub Pages após a publicação: https://kleuber14.github.io/pulse/.

## Validação e limites

- **39 testes aprovados**, incluindo as soluções das 30 fases e 366 datas do diário.
- Integração DOM: progressão inteira, medalhas, dicas, teclado, desfazer, reiniciar, preferências, bloqueio de fases, cliques repetidos e navegação durante animações.
- Build Vite de produção aprovado, com caminhos relativos.
- Não foi possível fazer inspeção visual em navegador real: o ambiente não disponibilizou a ferramenta de prévia exigida. Os testes DOM não validam renderização CSS, saída de áudio, Web Share nativo nem comportamento físico em Android. Faça essa conferência antes de uma publicação pública.
- Compartilhamento usa Web Share quando disponível, depois área de transferência, depois texto selecionável. Algumas APIs dependem de contexto seguro (HTTPS ou localhost).
- Progresso não sincroniza entre dispositivos. Limpar os dados do navegador apaga os resultados.
