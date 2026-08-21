import type { Dictionary } from "./en";

/**
 * PHASE 1 - French.
 *
 * STATUS: DRAFTED, NOT REVIEWED BY A NATIVE SPEAKER.
 *
 * French is a real requirement in Algeria, and shipping the English strings
 * under a French flag would be worse than shipping nothing. So the translation
 * is complete and idiomatic to the best of my ability, and it is flagged here
 * rather than quietly presented as final. Anything a driver could act on
 * wrongly - permissions, account status, error recovery - should be read by a
 * native speaker before the app goes to the fleet.
 *
 * Register: `vous`. The company addresses its drivers formally.
 */
export const FR_NEEDS_NATIVE_REVIEW = true;

export const fr: Dictionary = {
  common: {
    appName: "flaminGO",
    driverSuffix: "Chauffeur",
    retry: "Réessayer",
    cancel: "Annuler",
    confirm: "Confirmer",
    save: "Enregistrer",
    saved: "Enregistré",
    back: "Retour",
    next: "Suivant",
    close: "Fermer",
    done: "Terminé",
    loading: "Chargement…",
    refresh: "Actualiser",
    signOut: "Se déconnecter",
    ok: "OK",
    yes: "Oui",
    no: "Non",
    notAvailable: "Non disponible",
  },

  units: {
    km: "km",
    min: "min",
    secondsShort: "s",
  },

  language: {
    title: "Langue",
    arabic: "العربية",
    french: "Français",
    english: "English",
    restartTitle: "Redémarrage requis",
    restartBody:
      "Changer de langue modifie le sens de lecture de l'interface. L'application doit redémarrer pour l'appliquer.",
    restartNow: "Redémarrer maintenant",
    restartLater: "Plus tard",
    restartManual:
      "Fermez puis rouvrez l'application pour terminer le changement de langue.",
  },

  nav: {
    requests: "Demandes",
    map: "Carte",
    menu: "Menu",
  },

  splash: {
    tagline: "Conduisez avec flaminGO",
  },

  /** PHASE 2 - Stitch `welcome_onboarding`. */
  welcome: {
    titleLead: "Bienvenue chez",
    titleBrand: "flaminGO",
    subtitle: "Rejoignez la flotte de chauffeurs la plus reconnue d'Algérie.",
    start: "Commencer l'inscription",
    signIn: "Se connecter",
  },

  /** PHASE 2 - Stitch `phone_number_entry` and `otp_verification`. */
  login: {
    role: "Pour les chauffeurs",
    phoneTitle: "Numéro de téléphone",
    phoneSubtitle:
      "Saisissez votre numéro de téléphone pour recevoir le code de vérification",
    phoneLabel: "Numéro de téléphone",
    phonePlaceholder: "555 123 456",
    phoneHelper: "Nous vérifierons ce numéro par un court message texte.",
    sendCode: "Envoyer le code",
    codeTitle: "Vérification du code",
    codeSubtitle: "Nous avons envoyé un code de vérification au",
    codeLabel: "Code de vérification",
    verify: "Vérifier et continuer",
    changeNumber: "Changer de numéro",
    resend: "Renvoyer le code",
    resendQuestion: "Vous n'avez pas reçu le code ?",
    resendIn: "Renvoyer le code dans {time}",
    stepOf: "Étape {current} sur {total}",
    passwordTitle: "Mot de passe",
    passwordLabel: "Mot de passe",
    passwordSubtitle: "Saisissez votre mot de passe flaminGO",
    signIn: "Se connecter",
  },

  approval: {
    pendingTitle: "Votre compte est en cours d'examen",
    pendingBody:
      "Complétez vos informations et vos documents pour accélérer l'examen. Vous pourrez commencer à conduire dès que flaminGO aura approuvé votre compte.",
    rejectedTitle: "Compte refusé",
    rejectedBody:
      "Votre compte n'a pas été approuvé. Vérifiez vos documents, renvoyez ceux qui ont été refusés, ou contactez flaminGO.",
    suspendedTitle: "Compte temporairement suspendu",
    suspendedBody:
      "Votre compte est suspendu. Vous ne pouvez pas recevoir de courses tant que la suspension n'est pas levée.",
    bannedTitle: "Compte banni",
    bannedBody: "Ce compte a été banni définitivement de flaminGO.",
    statusLabel: "Statut du compte",
    checkAgain: "Vérifier le statut",
    loadFailed: "Impossible de récupérer le statut de votre compte.",
  },

  level: {
    bronze: "Bronze",
    silver: "Argent",
    gold: "Or",
    diamond: "Diamant",
    legendary: "Légendaire",
    levelLabel: "Niveau",
    nextLevel: "Niveau suivant",
    progress: "Progression",
  },

  home: {
    goOnline: "Se mettre en ligne",
    goOffline: "Se mettre hors ligne",
    onTripLabel: "En course",
    offlineHint: "Vous êtes hors ligne. Aucune demande ne vous parviendra.",
    onlineHint:
      "Vous êtes en ligne. Gardez l'application ouverte pour recevoir les demandes.",
    onTripHint:
      "Vous avez une course en cours. Terminez-la avant de changer de statut.",
    notApproved:
      "Vous ne pouvez pas vous mettre en ligne avant l'approbation de votre compte par flaminGO.",
    vehicleMissing: "Aucun véhicule enregistré.",
    linkConnected: "Connecté",
    linkConnecting: "Connexion…",
    linkDown: "Connexion perdue",
    recenter: "Recentrer",
    permissionDenied:
      "Accès à la localisation refusé. La localisation est nécessaire pour recevoir les courses proches.",
    permissionBlocked:
      "L'autorisation de localisation est définitivement refusée. Appuyez pour ouvrir les réglages.",
    permissionServicesOff:
      "Les services de localisation (GPS) sont désactivés. Appuyez pour les activer.",
  },

  documents: {
    title: "Documents",
    LICENSE: "Permis de conduire",
    ID_CARD: "Carte d'identité",
    INSURANCE: "Assurance",
    REGISTRATION: "Carte grise",
    PROFILE_PHOTO: "Photo de profil",
    statusPending: "En cours d'examen",
    statusApproved: "Vérifié",
    statusRejected: "Refusé",
    statusMissing: "Manquant",
  },

  errors: {
    invalidPhone: "Ce numéro de téléphone n'est pas valide.",
    invalidCode: "Le code est incorrect. Vérifiez les chiffres et réessayez.",
    expiredCode: "Le code a expiré. Demandez-en un nouveau.",
    tooManyRequests: "Trop de tentatives. Patientez un instant puis réessayez.",
    network: "Aucune connexion Internet. Vérifiez votre réseau et réessayez.",
    notDriver: "Ce compte n'est pas enregistré comme chauffeur flaminGO.",
    accountInactive: "Ce compte n'est pas actif. Contactez flaminGO.",
    generic: "Une erreur est survenue. Veuillez réessayer.",
  },
};
