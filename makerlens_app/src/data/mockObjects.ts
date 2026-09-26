import { ManufacturingObject } from '../types';

export const MOCK_OBJECTS: ManufacturingObject[] = [
  {
    id: 'pet-bottle',
    object_name: 'Bouteille en plastique (PET)',
    category: 'Emballage & Polymères',
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    materials: ['Polyéthylène téréphtalate (PET)', 'Colorants alimentaires', 'Polypropylène (Bouchon)'],
    carbon_score: '82g CO2e / unité',
    recyclability: '100% Recyclable (Code 1)',
    production_time: '4.2 secondes / unité',
    quiz: {
      question: "À quelle pression l'air est-il injecté pour souffler une préforme de bouteille PET ?",
      options: ['5 bars (Pression de pneu)', '40 bars (Très haute pression)', '200 bars (Pression sous-marine)'],
      correct_answer: 1,
      explanation: "L'air est injecté sous 40 bars de pression (près de 20 fois la pression d'un pneu de voiture) pour plaquer instantanément la matière chaude contre le moule !"
    },
    steps: [
      {
        step_number: 1,
        title: "Drying & Fusion de la résine",
        explanations: {
          kids: "On prend des granulés de plastique qui ressemblent à des petits grains de riz translucides et on les fait fondre comme du chocolat chaud dans un grand four !",
          general: "Les granulés de résine PET brute sont déshydratés puis chauffés dans une extrudeuse à haute température jusqu'à devenir une pâte visqueuse homogène.",
          expert: "Déshydratation des granulés de PET à 160°C pendant 4h (point de rosée -40°C). Plastification et plastification à vis hélicoïdale constante à 260°C - 280°C."
        },
        details: {
          machinery: "Sécheur à air asséché & Extrudeuse à vis sans fin",
          temperature: "260°C – 280°C",
          pressure: "120 bars",
          duration: "45 secondes"
        },
        image_url: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80"
      },
      {
        step_number: 2,
        title: "Injection de la Préforme",
        explanations: {
          kids: "Le plastique fondu est injecté dans un petit moule pour fabriquer un tube miniature à paroi très épaisse qui ressemble à une éprouvette magique avec son pas de vis !",
          general: "La résine en fusion est injectée sous pression dans un moule en acier pour former la préforme (un petit tube rigide doté du goulot définitif).",
          expert: "Presse à injecter haute cadence. Refroidissement ultra-rapide par eau glacée (6°C) pour stopper la cristallisation et conserver un polymère amorphe transparent."
        },
        details: {
          machinery: "Presse d'injection plastique hydraulique (48 empreintes)",
          temperature: "Moule refroidi à 6°C",
          pressure: "150 bars de maintien",
          duration: "1.8 seconde",
          tolerance: "± 0.05 mm sur le goulot"
        },
        image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
      },
      {
        step_number: 3,
        title: "Réchauffage Infrarouge",
        explanations: {
          kids: "La petite préforme passe dans un tunnel de lumières infrarouges magiques pour la rendre toute molle et élastique comme de la pâte à modeler !",
          general: "Les préformes circulent devant des lampes infrarouges pour ramollir le corps du plastique tout en gardant le goulot froid et rigide.",
          expert: "Conditionnement thermique sélectif par lampes IR Quartz. Gradient thermique longitudinal pour assurer un étirage d'épaisseur uniforme (90°C–110°C)."
        },
        details: {
          machinery: "Four rotatif à modules Infrarouge Quartz",
          temperature: "95°C – 105°C",
          duration: "8 secondes"
        },
        image_url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80"
      },
      {
        step_number: 4,
        title: "Soufflage-Étirage Haute Pression",
        explanations: {
          kids: "Une tige métallique pousse la préforme vers le bas puis PSHHH ! On insuffle un énorme coup d'air pour gonfler la bouteille dans son grand moule en aluminium !",
          general: "Une tige d'étirage descend au centre de la préforme chaud tandis que de l'air comprimé à 40 bars la gonfle pour épouser parfaitement les formes du moule.",
          expert: "Procédé de bi-orientation biaxiale par étirage mécanique longitudinal et soufflage pneumatique à 40 bars. Alignement des chaînes de polymères pour rigidité maximale."
        },
        details: {
          machinery: "Mouleuse-souffleuse rotative Sidel",
          temperature: "Moule chaud à 120°C (Thermofixation)",
          pressure: "40 bars",
          duration: "0.9 seconde",
          tolerance: "Épaisseur paroi 0.25 mm ± 0.02"
        },
        image_url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80"
      },
      {
        step_number: 5,
        title: "Contrôle Optique & Étiquetage",
        explanations: {
          kids: "Des caméras super rapides vérifient qu'il n'y a pas de trou ou de défaut, puis une machine colle l'étiquette et la bouteille est prête !",
          general: "Chaque bouteille est inspectée par vision artificielle à 360° pour déceler les micro-fissures avant le remplissage et la pose de l'étiquette.",
          expert: "Inspection optique CCD haute résolution (3000 bouteilles/min), contrôle de micro-fuite par différentiel de pression et mirage infra-rouge."
        },
        details: {
          machinery: "Système d'inspection optique & Étiqueteuse rotative manchon",
          duration: "En continu (36 000 unités / heure)"
        },
        image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: 'ceramic-mug',
    object_name: 'Tasse en Céramique Émaillée',
    category: 'Arts de la Table & Minéraux',
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    materials: ['Kaolin (Argile blanche)', 'Quartz', 'Feldspath', 'Émail vitrifié'],
    carbon_score: '320g CO2e / unité',
    recyclability: 'Matériau inerte (Réutilisable & Broyable)',
    production_time: '28 heures (Séchage & Cuisson)',
    quiz: {
      question: "À quelle température brûlante cuit-on une tasse en céramique au grand four ?",
      options: ['300°C (Comme un four de cuisine)', '1 250°C (La température de la lave de volcan !)', '5 000°C (La surface du soleil)'],
      correct_answer: 1,
      explanation: "À 1250°C, les grains de sable et d'argile se liquéfient et fusionnent entre eux pour devenir aussi durs et étanches que de la pierre !"
    },
    steps: [
      {
        step_number: 1,
        title: "Préparation de la Barbotine d'Argile",
        explanations: {
          kids: "On mélange de la terre d'argile toute douce avec de l'eau purifiée et des minéraux pour créer une sorte de pâte à crêpes grise et crémeuse !",
          general: "L'argile Kaolin et les minéraux sont broyés avec de l'eau dans de grands malaxeurs pour former une suspension liquide appelée la barbotine.",
          expert: "Délitescence et atomisation de la barbotine (50% Kaolin, 25% Quartz, 25% Feldspath). Tamisage magnétique pour éliminer toute trace de fer métabolique."
        },
        details: {
          machinery: "Broyeur à boulets et Malaxeur sous vide",
          duration: "3 heures"
        },
        image_url: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80"
      },
      {
        step_number: 2,
        title: "Coulage dans le Moule en Plâtre",
        explanations: {
          kids: "On verse la barbotine dans un moule en plâtre. Le plâtre boit l'eau comme une éponge et laisse une belle tasse creuse sur les bords !",
          general: "La barbotine est versée dans un moule en plâtre. Le plâtre absorbe l'humidité de surface, formant une croûte d'argile solide de l'épaisseur souhaitée.",
          expert: "Coulage sous pression dans moule poreux en gypse micro-cellulaire. Absorption capillaire créant une paroi solide de 4 mm d'épaisseur."
        },
        details: {
          machinery: "Banc de coulage haute pression",
          duration: "20 minutes d'absorption",
          tolerance: "Épaisseur 4.0 mm ± 0.2 mm"
        },
        image_url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80"
      },
      {
        step_number: 3,
        title: "Fixation de l'Anse & Ébavurage",
        explanations: {
          kids: "On colle la poignée (l'anse) sur la tasse avec un peu d'argile humide puis un artisan lisse toutes les petites imperfections avec une éponge.",
          general: "L'anse est extrudée séparément et collée à l'argile liquide. Une étape de finition manuelle élimine les coutures du moule.",
          expert: "Collage d'anse par barbotine de jonction à fort retrait. Ébavurage mécanique et finissage de surface par micro-éponge synthétique."
        },
        details: {
          machinery: "Presse d'extrusion d'anse & Tournette de finition"
        },
        image_url: "https://images.unsplash.com/photo-1531973576160-7125cd663d86?auto=format&fit=crop&w=800&q=80"
      },
      {
        step_number: 4,
        title: "Première Cuisson (Cuisson 'Dégourdi')",
        explanations: {
          kids: "La tasse va faire un premier voyage dans un four très chaud pour devenir solide mais encore poreuse comme un morceau de craie.",
          general: "La tasse est cuite une première fois à 950°C. Cette étape extrait l'eau résiduelle et rend la pièce manipulable pour le trempage d'émail.",
          expert: "Cuisson de dégourdissement en four tunnel sous atmosphère oxydante à 950°C. Déshydratation des minéraux et calcination des matières organiques."
        },
        details: {
          machinery: "Four tunnel à gaz continu",
          temperature: "950°C",
          duration: "10 heures"
        },
        image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80"
      },
      {
        step_number: 5,
        title: "Émaillage & Grand Feu à 1250°C",
        explanations: {
          kids: "On plonge la tasse dans un bain de peinture liquide brillante puis on la cuit à 1250°C. L'émail se transforme en du verre super lisse !",
          general: "La tasse est trempée dans un bain de silicate minéral puis cuite au grand feu. L'émail fond et vitrifie, rendant la céramique étanche.",
          expert: "Émaillage par immersion automatique dans une suspension d'oxydes métalliques. Vitrification complète par cuisson à 1250°C (Palier 2h)."
        },
        details: {
          machinery: "Carrousel d'émaillage sous vide & Four à poussée à 1250°C",
          temperature: "1 250°C",
          duration: "14 heures"
        },
        image_url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: 'wooden-chair',
    object_name: 'Chaise en Bois de Chêne Massif',
    category: 'Mobilier & Ébénisterie',
    image_url: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80',
    materials: ['Chêne massif certifié FSC', 'Colle vinylique (PVAc)', 'Huile végétale protectrice'],
    carbon_score: '-12kg CO2e (Puits de Carbone Négarif)',
    recyclability: '100% Biodégradable & Valorisable',
    production_time: '12 heures',
    quiz: {
      question: "Comment s'appelle la technique traditionnelle pour emboîter solidement les pièces d'une chaise en bois sans aucune vis ?",
      options: ['L\'assemblage Tenon et Mortaise', 'Le collage à chaud', 'Le clouage croisé'],
      correct_answer: 0,
      explanation: "L'assemblage Tenon et Mortaise consiste à tailler une pièce mâle qui s'insère parfaitement dans une pièce femelle creusée, garantissant une solidité sur des siècles !"
    },
    steps: [
      {
        step_number: 1,
        title: "Sélection & Séchage du Chêne",
        explanations: {
          kids: "On choisit de beaux troncs d'arbres coupés puis on les laisse sécher longtemps dans un grand séchoir pour que le bois ne se torde pas !",
          general: "Les grumes de chêne sont débitées en planches puis placées dans un séchoir contrôlé pour stabiliser l'hygrométrie du bois à 8-10%.",
          expert: "Séchage convectionnel stabilisé du chêne européen à 8% ± 1% d'humidité. Prévention du tuilage et libération des tensions internes du fil de bois."
        },
        details: {
          machinery: "Séchoir sous vide à régulation hygrométrique",
          duration: "3 à 4 semaines",
          tolerance: "Taux d'humidité 8%"
        },
        image_url: "https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&w=800&q=80"
      },
      {
        step_number: 2,
        title: "Usinage CNC 5-Axe des Pièces",
        explanations: {
          kids: "Un robot sculpteur avec des fraises rotatives taille les pieds, le dossier et l'assise avec une précision chirurgicale !",
          general: "Une fraiseuse numérique 5 axes découpe les pieds courbés, l'assise ergonomique et creuse les assemblages avec une très grande précision.",
          expert: "Usinage par centre de fraisage numérique 5 axes simultanés. Tolérances géométriques de mortaisage de 0.05 mm pour ajustement serré."
        },
        details: {
          machinery: "Centre d'usinage numérique CNC 5 axes Homag",
          tolerance: "± 0.05 mm"
        },
        image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80"
      },
      {
        step_number: 3,
        title: "Assemblage Tenon-Mortaise & Encollage",
        explanations: {
          kids: "Les éléments s'emboîtent comme un puzzle géant ! On met un peu de colle magique et des serres-joints pour bien presser le tout.",
          general: "Les éléments sont assemblés à l'aide de tenons et mortaises collés avec une colle à bois haute résistance sous presse hydraulique.",
          expert: "Encollage PVAc D4 résistant à l'humidité. Pressage multidirectionnel hydraulique à 12 bars jusqu'à polymérisation de la colle."
        },
        details: {
          machinery: "Cadrage hydraulique automatique",
          pressure: "12 bars de pressage",
          duration: "45 minutes sous presse"
        },
        image_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80"
      },
      {
        step_number: 4,
        title: "Poncage de Finition & Huilage",
        explanations: {
          kids: "On ponce le bois avec du papier très fin pour qu'il soit ultra doux au toucher, puis on passe une huile naturelle protectrice !",
          general: "La chaise est poncée en plusieurs passes de grain fin puis enduite d'une huile naturelle végétale qui nourrit et protège la matière.",
          expert: "Poncage orbital étagé (Grains 120, 180, 240). Application de 2 couches d'huile d'abrasin polymérisée par séchage UV."
        },
        details: {
          machinery: "Robot ponceur orbital & Cabine de finition UV",
          duration: "1.5 heure"
        },
        image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80"
      }
    ]
  }
];
