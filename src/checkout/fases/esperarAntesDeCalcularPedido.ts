export async function esperarAntesDeCalcularPedido(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1200));
}
