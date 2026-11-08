export function tutorial(level, state, solution, finished = false) {
  if (level.daily || level.number > 3) return null;
  const steps = [
    {
      title: "Gire para conectar.",
      text: "Toque na peça marcada. Una o fio ao gerador verde.",
      lesson: "1 · UM TOQUE GIRA A PEÇA",
    },
    {
      title: "A energia precisa de um caminho.",
      text: "Una as pontas e veja a luz avançar.",
      lesson: "2 · CONECTE AS PONTAS",
    },
    {
      title: "Leve a luz até o fim.",
      text: "Acenda tudo, sem pontas soltas.",
      lesson: "3 · COMPLETE A REDE",
    },
  ];
  return {
    ...steps[level.number - 1],
    index: finished ? null : solution?.[0],
    remaining: solution?.length ?? 0,
  };
}
