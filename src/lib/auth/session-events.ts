/**
 * Canal de aviso de sessão expirada.
 *
 * O tratamento global de erros vive fora da árvore do React (no QueryClient) e não tem
 * acesso ao roteador. Em vez de forçar um recarregamento com `window.location`, ele avisa
 * por aqui, e um componente dentro do roteador faz a navegação — preservando o toast.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function onSessionExpired(listener: Listener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function notifySessionExpired(): void {
	for (const listener of listeners) listener();
}
