import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// Tema claro fixo: o tema escuro ainda não faz parte do produto.
const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      containerAriaLabel="Notificações"
      toastOptions={{ closeButtonAriaLabel: "Fechar notificação", ...toastOptions }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--success-soft)",
          "--success-text": "var(--success)",
          "--success-border": "color-mix(in oklab, var(--success) 30%, transparent)",
          "--error-bg": "color-mix(in oklab, var(--destructive) 6%, white)",
          "--error-text": "var(--destructive)",
          "--error-border": "color-mix(in oklab, var(--destructive) 30%, transparent)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
