# Configuration email Resend — Fireball Canada

## Setup avec uniquement Gmail (`fireballcarcarecanada@gmail.com`)

Vous **n'avez pas besoin** d'une vraie boîte `no-reply@...`. Voici comment ça fonctionne :

| Rôle | Adresse |
|------|---------|
| **Réception** (contact, RSVP, notifications) | `fireballcarcarecanada@gmail.com` |
| **Réponses clients** (Reply-To) | `fireballcarcarecanada@gmail.com` |
| **Expéditeur technique Resend** (FROM) | `onboarding@resend.dev` (fourni par Resend) |

Les clients voient « Fireball Canada ». S'ils répondent, ça arrive dans **votre Gmail**.

### Variables Vercel / `.env`

```env
RESEND_API_KEY=re_...
FIREBALL_FROM_EMAIL=Fireball Canada <onboarding@resend.dev>
CONTACT_INBOX_EMAIL=fireballcarcarecanada@gmail.com
FIREBALL_REPLY_TO_EMAIL=fireballcarcarecanada@gmail.com
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Ne mettez **pas** `FIREBALL_FROM_EMAIL=...@gmail.com` — Resend refuse Gmail en expéditeur. Le code bascule automatiquement sur `onboarding@resend.dev`.

### Compte Resend

Votre compte Resend doit être créé avec **fireballcarcarecanada@gmail.com**.

Avec `onboarding@resend.dev` (plan gratuit), Resend peut limiter l'envoi vers **uniquement** l'email du compte. Pour envoyer aux clients (training, contact, etc.), deux options :

1. **Vérifier `fireballcanada.com` dans Resend** (recommandé) — ajoutez les enregistrements DNS. Vous n'avez **pas** besoin d'une vraie boîte mail `no-reply@`, seulement le domaine vérifié côté Resend. Puis :
   ```env
   FIREBALL_FROM_EMAIL=Fireball Canada <noreply@fireballcanada.com>
   ```
2. **Passer au plan Resend payant** pour envoyer à n'importe quelle adresse avec `onboarding@resend.dev`.

## Erreur « Invalid sender domain »

Si `FIREBALL_FROM_EMAIL` pointe vers Gmail, Outlook, Yahoo ou iCloud, le serveur utilise automatiquement `onboarding@resend.dev` à la place.

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` ou `RESEND_KEY` | Clé API Resend |
| `FIREBALL_FROM_EMAIL` | Expéditeur Resend (défaut : `onboarding@resend.dev`) |
| `CONTACT_INBOX_EMAIL` | Boîte de réception équipe (défaut : `fireballcarcarecanada@gmail.com`) |
| `FIREBALL_REPLY_TO_EMAIL` | Reply-To pour les emails clients (défaut : même Gmail) |
| `SUPABASE_URL` | URL Supabase pour l'API serveur |
| `SUPABASE_SERVICE_ROLE_KEY` | Auth des emails training / partenaire / événements |

## Emails automatiques

- **Contact** → notification Gmail + accusé de réception au visiteur
- **Training (Academy)** → confirmation au client à la soumission
- **Événements RSVP** → notification vers Gmail
- **Décisions admin** (training / partenaire) → email au client quand l'admin envoie

Après toute modification de variables, **redéployez** sur Vercel.
