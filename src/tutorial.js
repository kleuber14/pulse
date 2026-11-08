export function tutorial(level, state, solution, finished = false) {
  if (level.daily || level.number > 3) return null;
  const steps = [
    {
      title: "Gire para conectar.",
      text: "O núcleo verde é o gerador. Toque na peça marcada para girá-la e unir os caminhos.",
      lesson: "1 · UM TOQUE GIRA A PEÇA",
    },
    {
      title: "A energia precisa de um caminho.",
      text: "Una as pontas dos fios. Quando a conexão fecha, a luz avança a partir do gerador verde.",
      lesson: "2 · CONECTE AS PONTAS",
    },
    {
      title: "Leve a luz até o fim.",
      text: "Acenda toda a rede sem deixar pontas soltas. Siga a luz e conecte as peças que ainda estão apagadas.",
      lesson: "3 · COMPLETE A REDE",
    },
  ];
  return {
    ...steps[level.number - 1],
    index: finished ? null : solution?.[0],
    remaining: solution?.length ?? 0,
  };
}
