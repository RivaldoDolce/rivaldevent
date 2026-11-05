# Catalogue expérimental — provenance et limites

## Statut des données

**Toutes les entrées actuelles sont des fixtures de démonstration**
(`source_type=demo_fixture`, `is_demo=true`). Elles ont été rédigées pour le
projet afin de couvrir un éventail réaliste de catégories, villes, langues,
formats et budgets camerounais. Elles **ne prétendent pas** correspondre à des
événements réels, à des dates confirmées ou à une billetterie disponible.

Lorsqu'une entrée réelle sera ajoutée, elle devra porter :

- `source_type` = `official` ou `public_listing` ;
- `source_url` renseignée ;
- `collected_at` (date de collecte) et `verified_at` (dernière vérification) ;
- `is_demo=false`.

## Schéma

| Colonne | Contrainte |
|---|---|
| `event_id` | identifiant stable et unique (`evt_XXX`) |
| `title` | non vide |
| `description` | non vide, texte original |
| `category` | vocabulaire contrôlé (voir ci-dessous) |
| `city` | ville canonique (`Douala`, `Yaounde`, `Buea`, `Limbe`, `Bafoussam`, `Kribi`, `Garoua`, `Bamenda`, `Ngaoundere`) |
| `venue` | facultatif |
| `price_min`, `price_max` | entiers ≥ 0, `price_min <= price_max`, **vide = prix inconnu** (jamais 0) |
| `currency` | `XAF` |
| `start_at` | ISO 8601 avec fuseau |
| `end_at` | ISO 8601 avec fuseau, facultatif |
| `language` | `fr` ou `en` |
| `tags` | séparés par `|` |
| `source_type` | `official`, `public_listing` ou `demo_fixture` |
| `source_url` | vide pour les fixtures |
| `collected_at` | date de collecte |
| `verified_at` | date de vérification, vide si non vérifié |
| `is_demo` | `true` pour une entrée fictive |

## Catégories

`music`, `festival`, `culture`, `arts`, `technology`, `entrepreneurship`,
`sport`, `education`, `entertainment`, `conference`, `theatre`, `gala`.

## Couverture visée

- **Villes** : Douala, Yaoundé, Buea, Limbe, Bafoussam, Kribi, Garoua,
  Bamenda, Ngaoundéré.
- **Langues** : français et anglais, dans leur langue d'origine.
- **Budgets** : gratuit, bas prix, prix intermédiaire, premium.
- **Formats** : concert, festival, conférence, atelier, spectacle, exposition,
  rencontre, tournoi.

## Volumétrie

Voir `../data/processed/dataset.summary.json` après exécution de
`scripts/build_dataset.py`. Le fichier source contient 72 entrées, dont 6
volontairement expirées pour tester le filtrage temporel.

## Droits

Les textes sont originaux et rédigés pour ce projet. Aucune description
protégée n'est recopiée. Les noms de lieux réels sont utilisés comme contexte,
sans affiliation ni partenariat revendiqué.
