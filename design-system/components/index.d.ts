import type * as React from 'react';
/** Une proposition d'accord issue du dictionnaire de Sanzo Wada. */
export interface Accord { numero: number; wada: string[]; depart: string; correspondance: string; ecart: number; fidelite: 'fidèle' | 'proche' | 'libre'; transpose: boolean; base: string; accords: string[]; proportions: number[] }
export type Roles = Record<'papier' | 'papier-clair' | 'filet' | 'encre' | 'encre-douce' | 'teinte' | 'teinte-douce' | 'base' | 'base-texte' | 'base-survol' | 'sur-base' | 'accord-1' | 'accord-2' | 'accord-3' | 'accord-texte' | 'sur-accord' | 'texte-tableau' | 'alerte-texte', string>;
export interface AccordWadaProps { depart?: string; taille?: 0 | 2 | 3 | 4; limite?: number; appliquer?: boolean; cible?: HTMLElement | null; onChange?: (accord: Accord, roles: { papier: Roles; encre: Roles }) => void }
export declare function AccordWada(props: AccordWadaProps): React.ReactElement;
export interface NuancierProps { accord: Accord; legende?: boolean }
export declare function Nuancier(props: NuancierProps): React.ReactElement;
export interface EnTeteProps { monogramme?: string; nom?: string; signature?: string; courant?: string }
export declare function EnTete(props: EnTeteProps): React.ReactElement;
export interface ModeOperatoireProps { etapes?: string[] }
export declare function ModeOperatoire(props: ModeOperatoireProps): React.ReactElement;
export interface FicheCommandeProps { numero?: string; code?: string; titre?: string; statut?: string; parametres?: string; prompt?: string; reglage?: string; combinaison?: string; aEviter?: string; exemple?: string; validation?: string }
export declare function FicheCommande(props: FicheCommandeProps): React.ReactElement;
export interface BlocPromptProps { code: string; titre?: string; copiable?: boolean }
export declare function BlocPrompt(props: BlocPromptProps): React.ReactElement;
export interface TableauParametresProps { colonnes: string[]; lignes: React.ReactNode[][] }
export declare function TableauParametres(props: TableauParametresProps): React.ReactElement;
export interface BoutonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variante?: 'plein' | 'accent' | 'trait' }
export declare function Bouton(props: BoutonProps): React.ReactElement;
declare global { interface Window { MML: {
  AccordWada: typeof AccordWada; Nuancier: typeof Nuancier; EnTete: typeof EnTete; ModeOperatoire: typeof ModeOperatoire; FicheCommande: typeof FicheCommande; BlocPrompt: typeof BlocPrompt; TableauParametres: typeof TableauParametres; Bouton: typeof Bouton;
  WADA: string[][];
  chercherAccords(depart: string, options?: { taille?: 0 | 2 | 3 | 4; limite?: number; transposer?: boolean }): Accord[];
  deriverRoles(accord: Pick<Accord, 'base' | 'accords'>): { papier: Roles; encre: Roles };
  appliquerAccord(accord: Accord, cible?: HTMLElement | null): { papier: Roles; encre: Roles };
  palettePrompt(accord: Accord): string;
} } }
