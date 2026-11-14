/**
 * Runway ("Try the Look") data.
 * Every element, process and size below is taken from the DAMI Factory Master
 * Tech Pack v2 (artwork & construction tables, sizes on M) or the DAMI brief.
 * Pins: left/top in % of the cut-out image box. Pin n ↔ panel row n.
 */
export type RunwayRow = { title: string; process: string; spec: string; thumb: string };
export type RunwayLook = {
  name: string;
  code: string;
  colour: string;
  image: string; // transparent cut-out
  aspect: number; // width / height of the cut-out
  product: { handle: string; colorway: string };
  pins: { x: number; y: number }[]; // pins 1..3 → rows 0..2
  rows: RunwayRow[];
};

const P = "/images/products/";
const hood = (thumb: string): RunwayRow => ({
  title: "Structured double-layer hood",
  process: "Construction",
  spec: "No drawcords, no eyelets",
  thumb,
});
const sleeve = (thumb: string, colour: string): RunwayRow => ({
  title: "DAMI cursive, both outer sleeves",
  process: "Machine embroidery",
  spec: `4.5 × 13 cm each · ${colour}`,
  thumb,
});

export const RUNWAY: RunwayLook[] = [
  {
    name: "Bordeaux Kiss",
    code: "CFM-K01",
    colour: "Bone",
    image: "/images/runway/cfm-k01-front.webp",
    aspect: 1006 / 1411,
    product: { handle: "bordeaux-kiss", colorway: "bone" },
    pins: [{ x: 52, y: 22 }, { x: 66, y: 43 }, { x: 10, y: 70 }],
    rows: [
      hood(`${P}cfm-k01-detail-label.jpg`),
      { title: "Chest “Confirmed” serif", process: "Screen print", spec: "10.5 × 2.3 cm · Bordeaux", thumb: `${P}cfm-k01-detail-chest.jpg` },
      sleeve(`${P}cfm-k01-detail-sleeve.jpg`, "Bordeaux thread"),
      { title: "Five lips, back", process: "Screen print", spec: "27 × 29 cm · Bordeaux matte, distressed", thumb: `${P}cfm-k01-back.jpg` },
    ],
  },
  {
    name: "Éclat",
    code: "ESS-E01",
    colour: "Bone",
    image: "/images/runway/ess-e01-bone-front.webp",
    aspect: 663 / 971,
    product: { handle: "eclat-desir-ombre", colorway: "bone" },
    pins: [{ x: 50, y: 26 }, { x: 64, y: 46 }, { x: 13, y: 77 }],
    rows: [
      hood(`${P}ess-e01-bone-front.jpg`),
      { title: "Front word ÉCLAT", process: "Screen print or fine embroidery trial", spec: "8.5 × 1.7 cm · Colourway contrast", thumb: `${P}ess-e01-bone-front.jpg` },
      sleeve(`${P}ess-e01-bone-front.jpg`, "Colourway contrast"),
      { title: "Roman I with two bars, back", process: "Screen print", spec: "12 × 2.3 cm", thumb: `${P}ess-e01-bone-back.jpg` },
    ],
  },
  {
    name: "Désir",
    code: "ESS-E01",
    colour: "Bordeaux",
    image: "/images/runway/ess-e01-bordeaux-front.webp",
    aspect: 668 / 965,
    product: { handle: "eclat-desir-ombre", colorway: "bordeaux" },
    pins: [{ x: 50, y: 26 }, { x: 64, y: 46 }, { x: 13, y: 77 }],
    rows: [
      hood(`${P}ess-e01-detail-fabric.jpg`),
      { title: "Front word DÉSIR", process: "Screen print or fine embroidery trial", spec: "8.5 × 1.7 cm · Colourway contrast", thumb: `${P}ess-e01-bordeaux-front.jpg` },
      sleeve(`${P}ess-e01-detail-sleeve.jpg`, "Colourway contrast"),
      { title: "Roman I with two bars, back", process: "Screen print", spec: "12 × 2.3 cm", thumb: `${P}ess-e01-detail-motif.jpg` },
    ],
  },
  {
    name: "Ombre",
    code: "ESS-E01",
    colour: "Black",
    image: "/images/runway/ess-e01-black-front.webp",
    aspect: 663 / 968,
    product: { handle: "eclat-desir-ombre", colorway: "black" },
    pins: [{ x: 50, y: 26 }, { x: 64, y: 46 }, { x: 13, y: 77 }],
    rows: [
      hood(`${P}ess-e01-black-front.jpg`),
      { title: "Front word OMBRE", process: "Screen print or fine embroidery trial", spec: "8.5 × 1.7 cm · Colourway contrast", thumb: `${P}ess-e01-black-front.jpg` },
      sleeve(`${P}ess-e01-black-front.jpg`, "Colourway contrast"),
      { title: "Symmetrical curved back motif", process: "Screen print — not a seam", spec: "2 strokes spanning 31 × 37 cm", thumb: `${P}ess-e01-black-back.jpg` },
    ],
  },
  {
    name: "Lumen",
    code: "ESS-L01",
    colour: "White",
    image: "/images/runway/ess-l01-front.webp",
    aspect: 866 / 1199,
    product: { handle: "lumen", colorway: "white" },
    pins: [{ x: 50, y: 29 }, { x: 53, y: 44 }, { x: 12, y: 78 }],
    rows: [
      hood(`${P}ess-l01-detail-fabric.jpg`),
      { title: "Double-chevron mark", process: "Screen print or embroidery trial", spec: "5.0 × 3.5 cm · Deep Bordeaux", thumb: `${P}ess-l01-detail-chevron.jpg` },
      sleeve(`${P}ess-l01-front.jpg`, "Deep Bordeaux"),
      { title: "Back DAMI × ESSENTIALS", process: "Screen print", spec: "24 × 2.0 cm · Deep Bordeaux", thumb: `${P}ess-l01-detail-back.jpg` },
    ],
  },
  {
    name: "I Edition",
    code: "IED-001",
    colour: "Bone",
    image: "/images/runway/ied-001-front.webp",
    aspect: 774 / 1097,
    product: { handle: "i-edition-sculpted", colorway: "bone" },
    pins: [{ x: 50, y: 25 }, { x: 50, y: 47 }, { x: 24, y: 62 }],
    rows: [
      { title: "Hood centre-back woven I tab", process: "Woven tab sewn into hood seam", spec: "1.2 × 4.0 cm · Tonal", thumb: `${P}ied-001-detail-hood.jpg` },
      { title: "Tiny front DAMI", process: "Embroidery or screen print trial", spec: "7.5 × 0.9 cm · Tone-on-tone", thumb: `${P}ied-001-front.jpg` },
      { title: "Curved stitched panels", process: "Actual cut-and-sew seams", spec: "Pattern-defined · Matching self fabric", thumb: `${P}ied-001-detail-shoulder.jpg` },
      { title: "Rib inset at side / elbow", process: "Sewn rib insert — optional", spec: "Pattern-defined · Tonal", thumb: `${P}ied-001-detail-rib.jpg` },
    ],
  },
  {
    name: "DAMI Confirmed",
    code: "CFM-T01",
    colour: "Black",
    image: "/images/runway/cfm-t01-front.webp",
    aspect: 935 / 1330,
    product: { handle: "dami-confirmed", colorway: "black" },
    pins: [{ x: 50, y: 26 }, { x: 50, y: 52 }, { x: 14, y: 72 }],
    rows: [
      hood(`${P}cfm-t01-detail-label.jpg`),
      { title: "Front body", process: "No artwork", spec: "Leave blank", thumb: `${P}cfm-t01-front.jpg` },
      sleeve(`${P}cfm-t01-detail-sleeve.jpg`, "Red / Bordeaux thread"),
      { title: "Back DAMI serif wordmark", process: "Screen print", spec: "24 × 6.5 cm · Red / Bordeaux", thumb: `${P}cfm-t01-detail-print.jpg` },
    ],
  },
];
