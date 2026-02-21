# Fireball — Site & Boutique Esthétique Automobile

Site vitrine et boutique e-commerce premium pour produits d'esthétique automobile (gamme Classique, Pro et Revêtements). Design haut de gamme inspiré de l'univers Porsche.

## Stack

- **React 18** + **TypeScript**
- **Vite**
- **React Router**
- **Tailwind CSS**

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Structure

- **Accueil** : Hero, 3 gammes (Classique, Pro, Revêtements), produits phares
- **Boutique** : Liste produits avec filtres par catégorie, ajout au panier
- **Fiche produit** : Détail, quantité, ajout au panier / acheter
- **Panier** : Récap, quantités, total (commande à brancher sur un backend/paiement)

Les produits et catégories sont définis dans `src/data/products.ts`. Vous pouvez y ajouter vos vrais produits et images.
