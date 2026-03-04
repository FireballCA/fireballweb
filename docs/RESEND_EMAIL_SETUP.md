# Configuration email Resend (partenaires / envoi)

## Erreur « Invalid sender domain for Resend »

Si vous voyez :

> Invalid sender domain for Resend. Public domains (gmail/outlook/yahoo/icloud) cannot be used as FROM. Verify your own domain in Resend and set FIREBALL_FROM_EMAIL with that domain.

c’est que l’adresse **FROM** utilisée est soit un domaine public (Gmail, Outlook, Yahoo, iCloud), soit un domaine **non vérifié** dans Resend. Resend n’accepte que des domaines que vous possédez et que vous avez vérifiés.

## Étapes pour corriger

### 1. Vérifier votre domaine dans Resend

1. Allez sur [Resend → Domains](https://resend.com/domains).
2. Ajoutez votre domaine (ex. `fireballcanada.com`).
3. Suivez les instructions pour ajouter les enregistrements **SPF**, **DKIM** (et éventuellement **DMARC**) chez votre hébergeur DNS.
4. Attendez que le statut du domaine soit **Verified**.

### 2. Définir `FIREBALL_FROM_EMAIL` avec ce domaine

Sur le serveur (Vercel, Netlify, ou votre `.env` local), définissez :

```env
FIREBALL_FROM_EMAIL=Fireball Canada <no-reply@votredomaine.com>
```

Remplacez `votredomaine.com` par le domaine que vous venez de vérifier dans Resend (ex. `no-reply@fireballcanada.com`).

- **Ne pas** utiliser une adresse @gmail.com, @outlook.com, @yahoo.com, @icloud.com.
- Utiliser une adresse sur **votre** domaine vérifié (ex. `partners@fireballcanada.com`, `no-reply@fireballcanada.com`).

### 3. Redéployer / redémarrer

Après avoir mis à jour la variable d’environnement, redéployez l’API ou redémarrez le serveur pour que `FIREBALL_FROM_EMAIL` soit prise en compte.

## Variables d’environnement liées

| Variable              | Description |
|----------------------|-------------|
| `FIREBALL_FROM_EMAIL` | Adresse d’envoi (ex. `Fireball Canada <no-reply@fireballcanada.com>`). Doit être sur un **domaine vérifié** dans Resend. |
| `RESEND_API_KEY` ou `RESEND_KEY` | Clé API Resend (dashboard Resend → API Keys). |
