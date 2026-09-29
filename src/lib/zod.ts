import { z } from "zod";

/**
 * Mensagens padrão do Zod em português. Os schemas já definem as próprias mensagens; isto só
 * cobre o que escapar delas, para o usuário nunca ver um texto em inglês.
 */
z.config(z.locales.ptBR());
