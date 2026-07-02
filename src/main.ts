import Phaser from "phaser";
import "./style.css";

const WIDTH = 1280;
const HEIGHT = 720;
const LANES = [390, 640, 890];
const LANE_WIDTH = 180;
const CENTER_LANE = Math.floor(LANES.length / 2);
const LAST_LANE = LANES.length - 1;
const LANE_FIELD_LEFT = LANES[0] - LANE_WIDTH / 2 - 24;
const LANE_FIELD_WIDTH = LANES[LAST_LANE] - LANES[0] + LANE_WIDTH + 48;
const PLAYER_Y = 558;
const SPAWN_Y = -46;
const ESCAPE_Y = 666;
const DURATION = 300;
const PUBLIC_BASE = import.meta.env.BASE_URL;

const P0_ASSET_IDS = [
  "BG_001",
  "BG_002",
  "BG_003",
  "BG_004",
  "CHAR_001",
  "CHAR_002",
  "CHAR_003",
  "ENEMY_001",
  "ENEMY_002",
  "ENEMY_003",
  "ENEMY_004",
  "ENEMY_005",
  "ENEMY_006",
  "ENEMY_007",
  "CHEST_001",
  "CHEST_002",
  "CHEST_003",
  "CHEST_004",
  "CHEST_006",
  "PICKUP_001",
  "PICKUP_002",
  "BOSS_001",
  "BOSS_002",
  "BOSS_008",
  "BOSS_009",
  "ITEM_001",
  "ITEM_002",
  "ITEM_003",
  "ITEM_004",
  "ITEM_005",
  "ITEM_006",
  "ITEM_007",
  "ITEM_008",
  "MAT_001",
  "MAT_002",
  "MAT_003",
  "MAT_004",
  "MAT_005",
  "MAT_006",
  "MAT_007",
  "MAT_008",
  "MAT_009",
  "MAT_010",
  "SKILL_E_001",
  "SKILL_Q_001",
  "SKILL_Q_002",
  "SKILL_Q_003",
  "SKILL_Q_004",
  "SKILL_Q_005",
  "SKILL_R_001",
  "SKILL_W_001",
  "SUM_001",
  "VFX_001",
  "VFX_002",
  "VFX_003",
  "VFX_004",
  "VFX_005",
  "VFX_006",
  "VFX_007",
  "UI_001",
  "UI_002",
  "UI_003",
  "UI_004",
  "UI_005",
  "UI_006",
  "UI_007",
  "UI_008",
  "UI_011",
  "UI_012",
] as const;

type AssetId = (typeof P0_ASSET_IDS)[number];

const assetKey = (assetId: AssetId) => `p0_${assetId.toLowerCase()}`;
const publicAssetUrl = (path: string) => `${PUBLIC_BASE}${path.replace(/^\/+/, "")}`;
const assetUrl = (assetId: AssetId) => publicAssetUrl(`/assets/p0-runtime/${assetId.toLowerCase()}.webp`);

type EnemyKind =
  | "melee"
  | "ranged"
  | "cannon"
  | "super"
  | "assassin"
  | "mage"
  | "healer"
  | "summoner"
  | "chest"
  | "goldChest"
  | "mimic"
  | "resourceRed"
  | "resourceBlue"
  | "vision"
  | "dragonFire"
  | "dragonIce"
  | "dragonStorm"
  | "baron"
  | "core"
  | "node";

type ProjectileKind =
  | "auto"
  | "q"
  | "r"
  | "enemy"
  | "smite"
  | "burn"
  | "aura";

type Material =
  | "长剑"
  | "反曲弓"
  | "暴击手套"
  | "蓝水晶"
  | "法杖"
  | "生命宝石"
  | "护甲片"
  | "吸血石"
  | "冷却齿轮"
  | "速度靴";

const MATERIAL_ASSETS: Record<Material, AssetId> = {
  长剑: "MAT_001",
  反曲弓: "MAT_002",
  暴击手套: "MAT_003",
  蓝水晶: "MAT_004",
  法杖: "MAT_005",
  生命宝石: "MAT_006",
  护甲片: "MAT_007",
  吸血石: "MAT_008",
  冷却齿轮: "MAT_009",
  速度靴: "MAT_010",
};

const EQUIPMENT_ASSETS: Record<string, AssetId> = {
  无尽之刃型: "ITEM_001",
  破败之刃型: "ITEM_002",
  卢登回声型: "ITEM_003",
  日炎铠甲型: "ITEM_004",
  三相核心型: "ITEM_005",
  饮血剑型: "ITEM_006",
  冰霜权杖型: "ITEM_007",
  复活甲型: "ITEM_008",
};

type Upgrade = {
  title: string;
  rarity: "普通" | "稀有" | "史诗" | "传说";
  description: string;
  apply: () => void;
};

type Recipe = {
  name: string;
  needs: Material[];
  apply: () => void;
};

type SkillKey = "Q" | "R";
const ACTIVE_SKILLS: SkillKey[] = ["Q", "R"];

const SKILL_ICON_ASSETS: Record<SkillKey, AssetId> = {
  Q: "SKILL_Q_001",
  R: "SKILL_R_001",
};

const ENEMY_VISUALS: Record<EnemyKind, EnemyVisual> = {
  melee: { assetId: "ENEMY_001", scale: 1.62 },
  ranged: { assetId: "ENEMY_002", scale: 1.68 },
  cannon: { assetId: "ENEMY_003", scale: 1.92 },
  super: { assetId: "BOSS_001", scale: 2.9 },
  assassin: { assetId: "ENEMY_005", scale: 1.78 },
  mage: { assetId: "ENEMY_006", scale: 1.78 },
  healer: { assetId: "ENEMY_007", scale: 1.72 },
  summoner: { assetId: "ENEMY_006", tint: 0x67e8f9, scale: 1.82 },
  chest: { assetId: "CHEST_001", scale: 1.86 },
  goldChest: { assetId: "CHEST_003", scale: 1.92 },
  mimic: { assetId: "CHEST_006", scale: 1.98 },
  resourceRed: { assetId: "PICKUP_002", tint: 0xff6b6b, scale: 1.7 },
  resourceBlue: { assetId: "PICKUP_002", tint: 0x60a5fa, scale: 1.7 },
  vision: { assetId: "PICKUP_002", tint: 0x2dd4bf, scale: 1.62 },
  dragonFire: { assetId: "BOSS_002", scale: 3.2 },
  dragonIce: { assetId: "BOSS_002", tint: 0x8be9ff, scale: 3.2 },
  dragonStorm: { assetId: "BOSS_002", tint: 0xc084fc, scale: 3.2 },
  baron: { assetId: "BOSS_001", tint: 0xd8b4fe, scale: 3.05 },
  core: { assetId: "BOSS_008", scale: 2.45 },
  node: { assetId: "BOSS_009", scale: 2.05 },
};

type SkillState = {
  cd: number;
  readyAt: number;
  label: string;
  color: number;
};

type EnemyVisual = {
  assetId: AssetId;
  tint?: number;
  scale?: number;
};

type DebugWindow = Window & {
  __conveyorHunterDebug?: () => {
    elapsed: number;
    runState: string;
    enemies: number;
    projectiles: number;
    playerX: number;
    playerHp: number;
    crystalHp: number;
    level: number;
    gold: number;
    fps: number;
    expectedAssets: number;
    loadedAssets: number;
    webpManifestReady: boolean;
    qCooldownRemaining: number;
    qCasts: number;
    laneCount: number;
    visibleSkills: SkillKey[];
    isPaused: boolean;
  };
  __conveyorHunterDebugCastQ?: () => boolean;
  __conveyorHunterDebugTogglePause?: () => boolean;
};

type PlayerState = {
  hp: number;
  maxHp: number;
  shield: number;
  attackDamage: number;
  attackSpeed: number;
  critChance: number;
  critDamage: number;
  abilityPower: number;
  moveSpeed: number;
  range: number;
  lifesteal: number;
  cdr: number;
  xp: number;
  level: number;
  gold: number;
  cs: number;
  missed: number;
  combo: number;
  comboBest: number;
  comboGoldBonus: number;
  qPierce: number;
  qSplashes: boolean;
  autoBounces: number;
  onHitBurn: boolean;
  onHitPercent: number;
  aura: boolean;
  frostSkill: boolean;
  empowered: boolean;
  revive: boolean;
  invulnerableUntil: number;
  focusUntil: number;
  hasteUntil: number;
  burnBuffUntil: number;
  blueBuffUntil: number;
  slowUntil: number;
};

type Enemy = {
  id: number;
  kind: EnemyKind;
  lane: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  gold: number;
  xp: number;
  priority: number;
  escapedDamage: number;
  radius: number;
  lastHitWindow: number;
  shield: number;
  isBoss: boolean;
  isChest: boolean;
  isResource: boolean;
  status: Map<string, number>;
  nextActionAt: number;
  sprite: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.GameObject;
  lastHitRing: Phaser.GameObjects.Image;
  hpBack: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

type Projectile = {
  kind: ProjectileKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  color: number;
  pierce: number;
  sourceId?: number;
  targetId?: number;
  sprite: Phaser.GameObjects.Image;
  hit: Set<number>;
  ttl: number;
  fromEnemy: boolean;
  bounce: number;
};

type Warning = {
  lane: number;
  y: number;
  h: number;
  triggerAt: number;
  damage: number;
  sprite: Phaser.GameObjects.Image;
};

class ConveyorHunterScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerImage!: Phaser.GameObjects.Image;
  private playerCore!: Phaser.GameObjects.Arc;
  private playerAura!: Phaser.GameObjects.Arc;
  private shieldImage!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private targetX = LANES[CENTER_LANE];
  private lastMoveDir = 1;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private warnings: Warning[] = [];
  private nextEnemyId = 1;
  private elapsed = 0;
  private spawnTimer = 0;
  private autoReadyAt = 0;
  private crystalHp = 100;
  private maxCrystalHp = 100;
  private runState: "playing" | "upgrade" | "paused" | "won" | "lost" = "playing";
  private finalCoreSpawned = false;
  private finalCoreKilled = false;
  private bossEnemy?: Enemy;
  private materials = new Map<Material, number>();
  private equipment: string[] = [];
  private floatingTexts: Phaser.GameObjects.Text[] = [];
  private particles: Phaser.GameObjects.Image[] = [];
  private laneGraphics!: Phaser.GameObjects.Graphics;
  private effectsGraphics!: Phaser.GameObjects.Graphics;
  private playerHpText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private economyText!: Phaser.GameObjects.Text;
  private crystalBar!: Phaser.GameObjects.Rectangle;
  private crystalText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Rectangle;
  private bossBarBack!: Phaser.GameObjects.Rectangle;
  private bossBar!: Phaser.GameObjects.Rectangle;
  private bossText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private materialText!: Phaser.GameObjects.Text;
  private equipmentText!: Phaser.GameObjects.Text;
  private materialHud!: Phaser.GameObjects.Container;
  private equipmentHud!: Phaser.GameObjects.Container;
  private materialHudSignature = "__init";
  private equipmentHudSignature = "__init";
  private eventText!: Phaser.GameObjects.Text;
  private skillTexts = new Map<SkillKey, Phaser.GameObjects.Text>();
  private skillIconImages = new Map<SkillKey, Phaser.GameObjects.Image>();
  private skillCooldownTexts = new Map<SkillKey, Phaser.GameObjects.Text>();
  private pauseButtonLabel!: Phaser.GameObjects.Text;
  private pausePanel?: Phaser.GameObjects.Container;
  private upgradePanel?: Phaser.GameObjects.Container;
  private resultPanel?: Phaser.GameObjects.Container;
  private recipes!: Recipe[];
  private fpsValue = 60;
  private fpsAccumulator = 0;
  private fpsFrames = 0;
  private qCasts = 0;
  private playerState: PlayerState = {
    hp: 100,
    maxHp: 100,
    shield: 0,
    attackDamage: 10,
    attackSpeed: 1,
    critChance: 0.05,
    critDamage: 2,
    abilityPower: 0,
    moveSpeed: 300,
    range: 500,
    lifesteal: 0,
    cdr: 0,
    xp: 0,
    level: 1,
    gold: 0,
    cs: 0,
    missed: 0,
    combo: 0,
    comboBest: 0,
    comboGoldBonus: 0,
    qPierce: 3,
    qSplashes: false,
    autoBounces: 0,
    onHitBurn: false,
    onHitPercent: 0,
    aura: false,
    frostSkill: false,
    empowered: false,
    revive: false,
    invulnerableUntil: 0,
    focusUntil: 0,
    hasteUntil: 0,
    burnBuffUntil: 0,
    blueBuffUntil: 0,
    slowUntil: 0,
  };
  private skills: Record<SkillKey, SkillState> = {
    Q: { cd: 3.2, readyAt: 0, label: "穿云箭", color: 0x4bb7ff },
    R: { cd: 28, readyAt: 0, label: "剑雨", color: 0xd76cff },
  };
  private eventSchedule = [
    { time: 45, name: "超级炮车王", done: false },
    { time: 60, name: "火焰龙", done: false },
    { time: 150, name: "冰霜龙", done: false },
    { time: 210, name: "大龙巨兽", done: false },
    { time: 270, name: "敌方水晶核心", done: false },
  ];

  constructor() {
    super("conveyor-hunter");
  }

  preload() {
    P0_ASSET_IDS.forEach((assetId) => {
      this.load.image(assetKey(assetId), assetUrl(assetId));
    });
    this.load.json("p0_runtime_manifest", publicAssetUrl("/assets/p0-runtime/manifest.json"));
  }

  create() {
    this.cameras.main.setBackgroundColor("#070a12");
    this.createWorld();
    this.createPlayer();
    this.createHud();
    this.setupInput();
    this.createRecipes();
    this.exposeDebugState();
    this.spawnEnemy("melee", CENTER_LANE);
    this.spawnEnemy("melee", 0);
    this.spawnEnemy("chest", LAST_LANE);
    this.showFloatingText(WIDTH / 2, 154, "单路猎人", "#f6d77a", 28, 1600);
  }

  update(_: number, deltaMs: number) {
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.updateFps(dt);
    if (this.runState === "won" || this.runState === "lost") {
      this.updateEffects(dt);
      return;
    }

    if (this.runState === "paused") {
      this.drawLanes();
      this.updateEffects(dt);
      this.updateHud();
      return;
    }

    if (this.runState === "playing") {
      this.elapsed += dt;
      this.handleInput(dt);
      this.updateDirector(dt);
      this.updateEnemies(dt);
      this.updateProjectiles(dt);
      this.updateWarnings(dt);
      this.updateAutoAttack();
      this.updateAuras(dt);
      this.checkWinLoss();
    }

    this.drawLanes();
    this.updateEffects(dt);
    this.updateHud();
  }

  private createWorld() {
    this.add.image(WIDTH / 2, HEIGHT / 2, assetKey("BG_001")).setDisplaySize(WIDTH, HEIGHT).setDepth(0);
    this.add
      .image(WIDTH / 2, HEIGHT / 2, assetKey("BG_002"))
      .setDisplaySize(WIDTH, HEIGHT)
      .setAlpha(0.5)
      .setDepth(1);
    this.add
      .image(WIDTH / 2, 74, assetKey("BG_004"))
      .setDisplaySize(190, 126)
      .setAlpha(0.55)
      .setDepth(2);
    this.add
      .image(WIDTH / 2, 638, assetKey("BG_003"))
      .setDisplaySize(164, 132)
      .setAlpha(0.5)
      .setDepth(2);

    const bg = this.add.graphics();
    bg.fillStyle(0x020617, 0.42);
    bg.fillRect(0, 0, WIDTH, 44);
    bg.fillStyle(0x020617, 0.42);
    bg.fillRoundedRect(LANE_FIELD_LEFT - 26, 30, 30, 642, 8);
    bg.fillRoundedRect(LANE_FIELD_LEFT + LANE_FIELD_WIDTH - 4, 30, 30, 642, 8);
    bg.lineStyle(2, 0xf0c56a, 0.35);
    bg.strokeRoundedRect(LANE_FIELD_LEFT, 50, LANE_FIELD_WIDTH, 604, 10);
    bg.setDepth(3);

    this.laneGraphics = this.add.graphics();
    this.laneGraphics.setDepth(4);
    this.effectsGraphics = this.add.graphics();
    this.effectsGraphics.setDepth(55);
    this.drawLanes();

  }

  private drawLanes() {
    this.laneGraphics.clear();
    const arrowOffset = (this.elapsed * 82) % 72;
    LANES.forEach((x, i) => {
      const shade = i % 2 === 0 ? 0x111827 : 0x182235;
      this.laneGraphics.fillStyle(shade, 0.5);
      this.laneGraphics.fillRoundedRect(x - LANE_WIDTH / 2, 56, LANE_WIDTH, 592, 8);
      this.laneGraphics.lineStyle(2, 0x7dd3fc, 0.36);
      this.laneGraphics.strokeRoundedRect(x - LANE_WIDTH / 2, 56, LANE_WIDTH, 592, 8);

      for (let y = 86 + arrowOffset; y < 630; y += 72) {
        this.laneGraphics.fillStyle(0xcbd5e1, 0.14);
        this.laneGraphics.beginPath();
        this.laneGraphics.moveTo(x - 26, y - 12);
        this.laneGraphics.lineTo(x + 26, y - 12);
        this.laneGraphics.lineTo(x, y + 20);
        this.laneGraphics.closePath();
        this.laneGraphics.fillPath();
      }
    });

    this.laneGraphics.fillStyle(0x102a43, 0.68);
    this.laneGraphics.fillRoundedRect(LANE_FIELD_LEFT + 4, 546, LANE_FIELD_WIDTH - 8, 108, 12);
    this.laneGraphics.lineStyle(2, 0x60a5fa, 0.55);
    this.laneGraphics.strokeRoundedRect(LANE_FIELD_LEFT + 4, 546, LANE_FIELD_WIDTH - 8, 108, 12);
  }

  private createPlayer() {
    this.playerShadow = this.add.ellipse(0, 18, 82, 28, 0x000000, 0.35);
    this.playerAura = this.add.circle(0, 0, 36, 0x67e8f9, 0.12);
    this.playerAura.setStrokeStyle(3, 0x7dd3fc, 0.45);
    this.shieldImage = this.add
      .image(0, 0, assetKey("VFX_007"))
      .setDisplaySize(126, 126)
      .setAlpha(0)
      .setVisible(false);
    this.playerImage = this.add.image(0, -5, assetKey("CHAR_001")).setDisplaySize(98, 98);
    this.playerCore = this.add.circle(0, 0, 26, 0x38bdf8, 1).setVisible(false);
    this.player = this.add.container(LANES[CENTER_LANE], PLAYER_Y, [
      this.playerShadow,
      this.playerAura,
      this.shieldImage,
      this.playerImage,
      this.playerCore,
    ]);
    this.player.setDepth(50);
  }

  private createHud() {
    const hudBg = this.add.rectangle(WIDTH / 2, 18, WIDTH, 36, 0x020617, 0.82);
    hudBg.setDepth(100);

    this.playerHpText = this.add
      .text(24, 10, "", {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "16px",
        color: "#f8fafc",
      })
      .setDepth(101);

    this.timerText = this.add
      .text(WIDTH / 2, 9, "", {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "20px",
        color: "#fef3c7",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0)
      .setDepth(101);

    this.economyText = this.add
      .text(WIDTH - 92, 10, "", {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "16px",
        color: "#fde68a",
      })
      .setOrigin(1, 0)
      .setDepth(101);

    this.xpBar = this.add.rectangle(155, 39, 0, 6, 0x8b5cf6, 1).setOrigin(0, 0.5);
    this.xpBar.setDepth(101);
    this.add.rectangle(155, 39, 180, 6, 0x312e81, 0.55).setOrigin(0, 0.5).setDepth(100);

    this.crystalBar = this.add
      .rectangle(WIDTH / 2, HEIGHT - 24, 540, 13, 0x22c55e, 1)
      .setDepth(101);
    this.add
      .rectangle(WIDTH / 2, HEIGHT - 24, 548, 21, 0x020617, 0.72)
      .setDepth(100)
      .setStrokeStyle(1, 0x4ade80, 0.6);
    this.crystalText = this.add
      .text(WIDTH / 2, HEIGHT - 24, "", {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "14px",
        color: "#bbf7d0",
        stroke: "#052e16",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(102);

    this.bossBarBack = this.add
      .rectangle(WIDTH / 2, 63, 520, 16, 0x450a0a, 0.85)
      .setVisible(false)
      .setDepth(100);
    this.bossBar = this.add
      .rectangle(WIDTH / 2 - 260, 63, 520, 16, 0xef4444, 1)
      .setOrigin(0, 0.5)
      .setVisible(false)
      .setDepth(101);
    this.bossText = this.add
      .text(WIDTH / 2, 78, "", {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "14px",
        color: "#fecaca",
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setVisible(false);

    this.comboText = this.add
      .text(24, 52, "", {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "22px",
        color: "#facc15",
        fontStyle: "bold",
      })
      .setDepth(101);

    this.eventText = this.add
      .text(WIDTH - 24, 52, "", {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "15px",
        color: "#c4b5fd",
      })
      .setOrigin(1, 0)
      .setDepth(101);

    this.materialText = this.add
      .text(24, 622, "材料", {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "13px",
        color: "#e2e8f0",
        fontStyle: "bold",
        wordWrap: { width: 260 },
      })
      .setDepth(101);
    this.materialHud = this.add.container(24, 646).setDepth(101);
    this.equipmentText = this.add
      .text(WIDTH - 24, 598, "装备", {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "13px",
        color: "#fef3c7",
        fontStyle: "bold",
        align: "right",
        wordWrap: { width: 260 },
      })
      .setOrigin(1, 0)
      .setDepth(101);
    this.equipmentHud = this.add.container(WIDTH - 260, 622).setDepth(101);

    this.createPauseButton();
    this.createSkillHud();
  }

  private createPauseButton() {
    const bg = this.add
      .rectangle(WIDTH - 40, 20, 42, 30, 0x111827, 0.95)
      .setStrokeStyle(1, 0xfef3c7, 0.72)
      .setDepth(103)
      .setInteractive({ useHandCursor: true });
    this.pauseButtonLabel = this.add
      .text(WIDTH - 40, 19, "Ⅱ", {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "18px",
        color: "#fef3c7",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(104);
    bg.on("pointerdown", () => this.togglePause());
  }

  private createSkillHud() {
    const start = WIDTH / 2 - 41;
    ACTIVE_SKILLS.forEach((key, index) => {
      const x = start + index * 82;
      const y = HEIGHT - 74;
      const state = this.skills[key];
      const frameKey = key === "R" ? assetKey("UI_002") : assetKey("UI_001");
      const box = this.add
        .image(x, y, frameKey)
        .setDisplaySize(key === "R" ? 68 : 60, key === "R" ? 68 : 60)
        .setDepth(100);
      const icon = this.add
        .image(x, y - 1, assetKey(SKILL_ICON_ASSETS[key]))
        .setDisplaySize(key === "R" ? 48 : 42, key === "R" ? 48 : 42)
        .setDepth(100);
      const keyText = this.add
        .text(x - 21, y - 25, key, {
          fontFamily: "Arial, PingFang SC, sans-serif",
          fontSize: "14px",
          color: "#f8fafc",
          fontStyle: "bold",
          stroke: "#020617",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(101);
      const label = this.add
        .text(x, y + 16, state.label, {
          fontFamily: "Arial, PingFang SC, sans-serif",
          fontSize: "12px",
          color: "#cbd5e1",
        })
        .setOrigin(0.5)
        .setDepth(101);
      const cdText = this.add
        .text(x, y, "", {
          fontFamily: "Arial, PingFang SC, sans-serif",
          fontSize: "18px",
          color: "#fef2f2",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(102);
      this.skillTexts.set(key, keyText);
      this.skillIconImages.set(key, icon);
      this.skillCooldownTexts.set(key, cdText);
      void box;
      void label;
    });
  }

  private setupInput() {
    if (!this.input.keyboard) return;
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      left2: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      right2: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
      r: Phaser.Input.Keyboard.KeyCodes.R,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      restart: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.input.keyboard.on("keydown-P", () => this.togglePause());
    this.input.keyboard.on("keydown-ESC", () => this.togglePause());

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.runState === "playing" && pointer.y > 80 && pointer.y < 650) {
        this.targetX = Phaser.Math.Clamp(pointer.x, LANES[0], LANES[LANES.length - 1]);
      }
    });
  }

  private exposeDebugState() {
    (window as DebugWindow).__conveyorHunterDebug = () => ({
      elapsed: Number(this.elapsed.toFixed(2)),
      runState: this.runState,
      enemies: this.enemies.length,
      projectiles: this.projectiles.length,
      playerX: Number(this.player.x.toFixed(1)),
      playerHp: Number(this.playerState.hp.toFixed(1)),
      crystalHp: Number(this.crystalHp.toFixed(1)),
      level: this.playerState.level,
      gold: this.playerState.gold,
      fps: this.fpsValue,
      expectedAssets: P0_ASSET_IDS.length,
      loadedAssets: P0_ASSET_IDS.filter((assetId) => this.textures.exists(assetKey(assetId))).length,
      webpManifestReady: Boolean(this.cache.json.get("p0_runtime_manifest")),
      qCooldownRemaining: Number(Math.max(0, this.skills.Q.readyAt - this.elapsed).toFixed(2)),
      qCasts: this.qCasts,
      laneCount: LANES.length,
      visibleSkills: [...ACTIVE_SKILLS],
      isPaused: this.runState === "paused",
    });
    (window as DebugWindow).__conveyorHunterDebugCastQ = () => {
      const before = this.qCasts;
      this.castQ();
      return this.qCasts > before;
    };
    (window as DebugWindow).__conveyorHunterDebugTogglePause = () => {
      this.togglePause();
      return this.runState === "paused";
    };
  }

  private togglePause() {
    if (this.runState === "playing") {
      this.runState = "paused";
      this.time.timeScale = 0;
      this.tweens.pauseAll();
      this.createPausePanel();
      this.updatePauseButton();
      return;
    }

    if (this.runState === "paused") {
      this.runState = "playing";
      this.time.timeScale = 1;
      this.tweens.resumeAll();
      this.pausePanel?.destroy(true);
      this.pausePanel = undefined;
      this.updatePauseButton();
    }
  }

  private updatePauseButton() {
    this.pauseButtonLabel?.setText(this.runState === "paused" ? "▶" : "Ⅱ");
  }

  private createPausePanel() {
    this.pausePanel?.destroy(true);
    const panelX = WIDTH / 2;
    const panelY = 294;
    const panel = this.add.rectangle(panelX, panelY, 660, 336, 0x0f172a, 0.96);
    panel.setStrokeStyle(2, 0xfacc15, 0.78);
    const title = this.add
      .text(panelX, panelY - 138, "暂停", {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "30px",
        color: "#fef3c7",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const equipment = this.equipment.length > 0 ? this.equipment.join(" / ") : "暂无";
    const materials =
      [...this.materials.entries()]
        .filter(([, count]) => count > 0)
        .slice(0, 10)
        .map(([mat, count]) => `${mat}x${count}`)
        .join("  ") || "暂无";
    const progress = this.recipeProgressLines();
    const body = this.add
      .text(
        panelX - 286,
        panelY - 92,
        `当前装备\n${equipment}\n\n材料\n${materials}\n\n接近合成\n${progress}`,
        {
          fontFamily: "Arial, PingFang SC, sans-serif",
          fontSize: "17px",
          color: "#e2e8f0",
          lineSpacing: 8,
          wordWrap: { width: 572 },
        },
      )
      .setOrigin(0, 0);

    this.pausePanel = this.add.container(0, 0, [panel, title, body]);
    this.pausePanel.setDepth(220);
  }

  private recipeProgressLines() {
    const candidates = this.recipes
      .filter((recipe) => !this.equipment.includes(recipe.name))
      .map((recipe) => {
        const required = new Map<Material, number>();
        recipe.needs.forEach((mat) => required.set(mat, (required.get(mat) ?? 0) + 1));
        let have = 0;
        let total = 0;
        required.forEach((count, mat) => {
          total += count;
          have += Math.min(this.materials.get(mat) ?? 0, count);
        });
        return { recipe, have, total, missing: total - have };
      })
      .sort((a, b) => a.missing - b.missing || b.have - a.have || a.recipe.name.localeCompare(b.recipe.name));

    if (candidates.length === 0) return "已集齐主要装备";
    return candidates
      .slice(0, 4)
      .map(({ recipe, have, total, missing }) => `${recipe.name}  ${have}/${total}  缺${missing}`)
      .join("\n");
  }

  private handleInput(dt: number) {
    const left = this.keys.left.isDown || this.keys.left2.isDown;
    const right = this.keys.right.isDown || this.keys.right2.isDown;
    const slow = this.elapsed < this.playerState.slowUntil ? 0.7 : 1;
    const speedBoost =
      this.elapsed < this.playerState.hasteUntil || this.elapsed < this.playerState.focusUntil
        ? 1.18
        : 1;
    const speed = this.playerState.moveSpeed * slow * speedBoost;

    if (left && !right) {
      this.targetX = this.player.x - speed * dt;
      this.lastMoveDir = -1;
    } else if (right && !left) {
      this.targetX = this.player.x + speed * dt;
      this.lastMoveDir = 1;
    }

    this.targetX = Phaser.Math.Clamp(this.targetX, LANES[0] - 44, LANES[LANES.length - 1] + 44);
    this.player.x = Phaser.Math.Linear(this.player.x, this.targetX, 0.36);

    if (Phaser.Input.Keyboard.JustDown(this.keys.q)) this.castQ();
    if (Phaser.Input.Keyboard.JustDown(this.keys.r)) this.castR();
    if (
      (this.runState === "won" || this.runState === "lost") &&
      Phaser.Input.Keyboard.JustDown(this.keys.restart)
    ) {
      this.scene.restart();
    }
  }

  private updateFps(dt: number) {
    this.fpsAccumulator += dt;
    this.fpsFrames += 1;
    if (this.fpsAccumulator >= 0.5) {
      this.fpsValue = Math.round(this.fpsFrames / this.fpsAccumulator);
      this.fpsAccumulator = 0;
      this.fpsFrames = 0;
    }
  }

  private setPlayerPose(pose: "idle" | "attack" | "dash", duration = 180) {
    const poseAsset: Record<"idle" | "attack" | "dash", AssetId> = {
      idle: "CHAR_001",
      attack: "CHAR_002",
      dash: "CHAR_003",
    };
    this.playerImage.setTexture(assetKey(poseAsset[pose]));
    if (pose !== "idle") {
      this.time.delayedCall(duration, () => {
        if (this.playerImage?.active) this.playerImage.setTexture(assetKey("CHAR_001"));
      });
    }
  }

  private createRecipes() {
    this.recipes = [
      {
        name: "无尽之刃型",
        needs: ["长剑", "暴击手套", "暴击手套"],
        apply: () => {
          this.playerState.attackDamage += 12;
          this.playerState.critChance += 0.14;
          this.playerState.critDamage += 0.45;
        },
      },
      {
        name: "破败之刃型",
        needs: ["长剑", "反曲弓", "吸血石"],
        apply: () => {
          this.playerState.attackSpeed += 0.22;
          this.playerState.lifesteal += 0.08;
          this.playerState.onHitPercent += 0.025;
        },
      },
      {
        name: "卢登回声型",
        needs: ["法杖", "蓝水晶", "冷却齿轮"],
        apply: () => {
          this.playerState.abilityPower += 25;
          this.playerState.cdr += 0.08;
          this.playerState.qSplashes = true;
        },
      },
      {
        name: "日炎铠甲型",
        needs: ["生命宝石", "护甲片", "护甲片"],
        apply: () => {
          this.playerState.maxHp += 38;
          this.playerState.hp += 38;
          this.playerState.aura = true;
        },
      },
      {
        name: "三相核心型",
        needs: ["长剑", "反曲弓", "蓝水晶"],
        apply: () => {
          this.playerState.attackDamage += 8;
          this.playerState.attackSpeed += 0.15;
          this.playerState.abilityPower += 10;
          this.playerState.empowered = true;
        },
      },
      {
        name: "饮血剑型",
        needs: ["长剑", "吸血石", "吸血石"],
        apply: () => {
          this.playerState.attackDamage += 15;
          this.playerState.lifesteal += 0.13;
        },
      },
      {
        name: "冰霜权杖型",
        needs: ["法杖", "生命宝石", "蓝水晶"],
        apply: () => {
          this.playerState.abilityPower += 20;
          this.playerState.maxHp += 24;
          this.playerState.hp += 24;
          this.playerState.frostSkill = true;
        },
      },
      {
        name: "复活甲型",
        needs: ["长剑", "护甲片", "生命宝石"],
        apply: () => {
          this.playerState.maxHp += 20;
          this.playerState.hp += 20;
          this.playerState.revive = true;
        },
      },
    ];
  }

  private updateDirector(dt: number) {
    this.eventSchedule.forEach((event) => {
      if (!event.done && this.elapsed >= event.time) {
        event.done = true;
        this.spawnScheduledEvent(event.name);
      }
    });

    const pressure = Phaser.Math.Clamp(this.elapsed / DURATION, 0, 1);
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    const interval = Phaser.Math.Linear(1.05, 0.43, pressure);
    this.spawnTimer = interval + Phaser.Math.FloatBetween(-0.12, 0.18);
    const waveSize = Phaser.Math.Between(1, this.elapsed > 190 ? 3 : this.elapsed > 90 ? 2 : 1);

    for (let i = 0; i < waveSize; i++) {
      this.spawnEnemy(this.pickEnemyKind(), this.randomLane());
    }

    if (Phaser.Math.FloatBetween(0, 1) < 0.08 + pressure * 0.08) {
      this.spawnEnemy(this.elapsed > 120 ? "goldChest" : "chest", this.randomLane());
    }

    if (this.elapsed > 55 && Phaser.Math.FloatBetween(0, 1) < 0.05) {
      this.spawnEnemy(Phaser.Math.FloatBetween(0, 1) > 0.5 ? "resourceRed" : "resourceBlue", this.randomLane());
    }

    if (this.elapsed > 70 && Phaser.Math.FloatBetween(0, 1) < 0.035) {
      this.spawnEnemy("vision", this.randomLane());
    }
  }

  private pickEnemyKind(): EnemyKind {
    const t = this.elapsed;
    const roll = Phaser.Math.FloatBetween(0, 1);
    if (t < 25) return roll < 0.78 ? "melee" : "ranged";
    if (t < 60) {
      if (roll < 0.48) return "melee";
      if (roll < 0.76) return "ranged";
      return "cannon";
    }
    if (t < 130) {
      if (roll < 0.32) return "melee";
      if (roll < 0.56) return "ranged";
      if (roll < 0.73) return "cannon";
      if (roll < 0.86) return "assassin";
      return "mage";
    }
    if (roll < 0.22) return "melee";
    if (roll < 0.42) return "ranged";
    if (roll < 0.6) return "cannon";
    if (roll < 0.72) return "assassin";
    if (roll < 0.84) return "mage";
    if (roll < 0.93) return "healer";
    return "summoner";
  }

  private spawnScheduledEvent(name: string) {
    const eventColor = name.includes("核心")
      ? "#fb7185"
      : name.includes("龙")
        ? "#f59e0b"
        : "#c4b5fd";
    this.showFloatingText(WIDTH / 2, 112, name, eventColor, 24, 1800);
    this.cameras.main.shake(220, 0.004);
    if (name === "超级炮车王") this.spawnEnemy("super", CENTER_LANE);
    if (name === "火焰龙") this.spawnEnemy("dragonFire", CENTER_LANE);
    if (name === "冰霜龙") this.spawnEnemy("dragonIce", CENTER_LANE);
    if (name === "大龙巨兽") this.spawnEnemy("baron", CENTER_LANE);
    if (name === "敌方水晶核心") {
      this.finalCoreSpawned = true;
      this.spawnEnemy("core", CENTER_LANE);
      LANES.forEach((_, lane) => this.spawnEnemy("node", lane));
    }
  }

  private spawnEnemy(kind: EnemyKind, lane: number) {
    lane = this.clampLane(lane);
    const spec = this.enemySpec(kind);
    const x = LANES[lane];
    const y = kind === "core" ? 112 : kind === "node" ? 154 : SPAWN_Y;
    const container = this.add.container(x, y);
    container.setDepth(spec.isBoss ? 32 : 24);

    const shadow = this.add.ellipse(0, spec.radius * 0.52, spec.radius * 1.6, spec.radius * 0.56, 0x000000, 0.27);
    const lastHitRing = this.add
      .image(0, spec.radius * 0.12, assetKey("VFX_004"))
      .setDisplaySize(spec.radius * 2.45, spec.radius * 2.45)
      .setAlpha(0)
      .setVisible(false);
    const body = this.createEnemyBody(kind, spec.radius);
    const label = this.add
      .text(0, -spec.radius - 26, spec.shortName, {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: spec.isBoss ? "15px" : "12px",
        color: spec.nameColor,
        fontStyle: spec.isBoss ? "bold" : "normal",
      })
      .setOrigin(0.5);
    const hpBack = this.add.rectangle(0, -spec.radius - 9, spec.radius * 1.6, 5, 0x111827, 0.88);
    const hpBar = this.add
      .rectangle(-spec.radius * 0.8, -spec.radius - 9, spec.radius * 1.6, 5, spec.hpColor, 1)
      .setOrigin(0, 0.5);

    container.add([shadow, lastHitRing, body, label, hpBack, hpBar]);

    const enemy: Enemy = {
      id: this.nextEnemyId++,
      kind,
      lane,
      x,
      y,
      hp: spec.hp,
      maxHp: spec.hp,
      speed: spec.speed,
      damage: spec.damage,
      gold: spec.gold,
      xp: spec.xp,
      priority: spec.priority,
      escapedDamage: spec.escapedDamage,
      radius: spec.radius,
      lastHitWindow: spec.lastHitWindow,
      shield: spec.shield,
      isBoss: spec.isBoss,
      isChest: spec.isChest,
      isResource: spec.isResource,
      status: new Map(),
      nextActionAt: this.elapsed + Phaser.Math.FloatBetween(1.4, 2.8),
      sprite: container,
      body,
      lastHitRing,
      hpBack,
      hpBar,
      label,
    };

    this.enemies.push(enemy);
    if (enemy.isBoss || kind === "core") {
      this.bossEnemy = enemy;
    }
    return enemy;
  }

  private enemySpec(kind: EnemyKind) {
    const pressure = Phaser.Math.Clamp(this.elapsed / DURATION, 0, 1);
    const scale = 1 + 0.75 * pressure + 1.1 * pressure * pressure;
    const bossScale = 1 + 0.45 * pressure + 0.95 * pressure * pressure;
    const common = {
      shield: 0,
      isBoss: false,
      isChest: false,
      isResource: false,
      nameColor: "#f8fafc",
      hpColor: 0xef4444,
      lastHitWindow: this.playerState.attackDamage * 1.15,
    };

    switch (kind) {
      case "melee":
        return {
          ...common,
          hp: 28 * scale,
          speed: 62 + this.elapsed * 0.03,
          damage: 1,
          gold: 4,
          xp: 6,
          priority: 1,
          escapedDamage: 1,
          radius: 22,
          shortName: "近战",
        };
      case "ranged":
        return {
          ...common,
          hp: 24 * scale,
          speed: 52,
          damage: 1,
          gold: 5,
          xp: 7,
          priority: 2,
          escapedDamage: 1,
          radius: 21,
          shortName: "远程",
          hpColor: 0xf97316,
        };
      case "cannon":
        return {
          ...common,
          hp: 94 * scale,
          speed: 36,
          damage: 5,
          gold: 18,
          xp: 18,
          priority: 5,
          escapedDamage: 5,
          radius: 29,
          shortName: "炮车",
          hpColor: 0xf59e0b,
          lastHitWindow: this.playerState.attackDamage * 1.25,
        };
      case "super":
        return {
          ...common,
          hp: 430 * bossScale,
          speed: 26,
          damage: 12,
          gold: 80,
          xp: 80,
          priority: 9,
          escapedDamage: 18,
          radius: 44,
          shortName: "炮车王",
          hpColor: 0xfbbf24,
          isBoss: true,
          lastHitWindow: this.playerState.attackDamage * 1.4,
        };
      case "assassin":
        return {
          ...common,
          hp: 56 * scale,
          speed: 88,
          damage: 9,
          gold: 10,
          xp: 13,
          priority: 6,
          escapedDamage: 3,
          radius: 22,
          shortName: "刺客",
          hpColor: 0xec4899,
          nameColor: "#f9a8d4",
        };
      case "mage":
        return {
          ...common,
          hp: 52 * scale,
          speed: 47,
          damage: 8,
          gold: 11,
          xp: 15,
          priority: 4,
          escapedDamage: 2,
          radius: 23,
          shortName: "法师",
          hpColor: 0xa78bfa,
          nameColor: "#ddd6fe",
        };
      case "healer":
        return {
          ...common,
          hp: 48 * scale,
          speed: 45,
          damage: 1,
          gold: 12,
          xp: 16,
          priority: 7,
          escapedDamage: 2,
          radius: 22,
          shortName: "治疗",
          hpColor: 0x4ade80,
          nameColor: "#bbf7d0",
        };
      case "summoner":
        return {
          ...common,
          hp: 66 * scale,
          speed: 42,
          damage: 2,
          gold: 13,
          xp: 18,
          priority: 7,
          escapedDamage: 3,
          radius: 24,
          shortName: "召唤",
          hpColor: 0x22d3ee,
          nameColor: "#a5f3fc",
        };
      case "chest":
        return {
          ...common,
          hp: 42,
          speed: 40,
          damage: 0,
          gold: 20,
          xp: 8,
          priority: 4,
          escapedDamage: 0,
          radius: 23,
          shortName: "木箱",
          hpColor: 0xeab308,
          isChest: true,
          nameColor: "#fef3c7",
        };
      case "goldChest":
        return {
          ...common,
          hp: 76,
          speed: 37,
          damage: 0,
          gold: 42,
          xp: 18,
          priority: 8,
          escapedDamage: 0,
          radius: 27,
          shortName: "金箱",
          hpColor: 0xfacc15,
          isChest: true,
          nameColor: "#fde68a",
          lastHitWindow: this.playerState.attackDamage * 1.35,
        };
      case "mimic":
        return {
          ...common,
          hp: 110 * scale,
          speed: 92,
          damage: 12,
          gold: 65,
          xp: 30,
          priority: 8,
          escapedDamage: 7,
          radius: 28,
          shortName: "箱怪",
          hpColor: 0xf43f5e,
          nameColor: "#fecdd3",
        };
      case "resourceRed":
        return {
          ...common,
          hp: 130 * scale,
          speed: 28,
          damage: 3,
          gold: 24,
          xp: 24,
          priority: 6,
          escapedDamage: 0,
          radius: 29,
          shortName: "红 Buff",
          hpColor: 0xfb7185,
          isResource: true,
          nameColor: "#fecdd3",
        };
      case "resourceBlue":
        return {
          ...common,
          hp: 120 * scale,
          speed: 28,
          damage: 3,
          gold: 24,
          xp: 24,
          priority: 6,
          escapedDamage: 0,
          radius: 29,
          shortName: "蓝 Buff",
          hpColor: 0x60a5fa,
          isResource: true,
          nameColor: "#bfdbfe",
        };
      case "vision":
        return {
          ...common,
          hp: 62,
          speed: 66,
          damage: 0,
          gold: 12,
          xp: 12,
          priority: 3,
          escapedDamage: 0,
          radius: 20,
          shortName: "河蟹",
          hpColor: 0x2dd4bf,
          isResource: true,
          nameColor: "#99f6e4",
        };
      case "dragonFire":
        return {
          ...common,
          hp: 650 * bossScale,
          speed: 15,
          damage: 16,
          gold: 120,
          xp: 105,
          priority: 10,
          escapedDamage: 20,
          radius: 54,
          shortName: "火焰龙",
          hpColor: 0xf97316,
          isBoss: true,
          nameColor: "#fed7aa",
          lastHitWindow: this.playerState.attackDamage * 1.7,
        };
      case "dragonIce":
        return {
          ...common,
          hp: 790 * bossScale,
          speed: 14.5,
          damage: 16,
          gold: 130,
          xp: 120,
          priority: 10,
          escapedDamage: 22,
          radius: 56,
          shortName: "冰霜龙",
          hpColor: 0x67e8f9,
          isBoss: true,
          nameColor: "#cffafe",
          lastHitWindow: this.playerState.attackDamage * 1.7,
        };
      case "dragonStorm":
        return {
          ...common,
          hp: 820 * bossScale,
          speed: 16,
          damage: 18,
          gold: 140,
          xp: 130,
          priority: 10,
          escapedDamage: 22,
          radius: 56,
          shortName: "风暴龙",
          hpColor: 0xc084fc,
          isBoss: true,
          nameColor: "#e9d5ff",
        };
      case "baron":
        return {
          ...common,
          hp: 1120 * bossScale,
          speed: 9.5,
          damage: 24,
          gold: 180,
          xp: 180,
          priority: 11,
          escapedDamage: 35,
          radius: 66,
          shortName: "大龙",
          hpColor: 0xa855f7,
          isBoss: true,
          nameColor: "#f0abfc",
          lastHitWindow: this.playerState.attackDamage * 2,
        };
      case "core":
        return {
          ...common,
          hp: 2100 * bossScale,
          speed: 0,
          damage: 26,
          gold: 0,
          xp: 0,
          priority: 12,
          escapedDamage: 0,
          radius: 72,
          shortName: "核心",
          hpColor: 0xf43f5e,
          isBoss: true,
          nameColor: "#fecdd3",
          lastHitWindow: this.playerState.attackDamage * 2.2,
        };
      case "node":
        return {
          ...common,
          hp: 260 * bossScale,
          speed: 0,
          damage: 10,
          gold: 35,
          xp: 30,
          priority: 9,
          escapedDamage: 0,
          radius: 28,
          shortName: "节点",
          hpColor: 0xf9a8d4,
          nameColor: "#fce7f3",
        };
    }
  }

  private createEnemyBody(kind: EnemyKind, radius: number) {
    const visual = ENEMY_VISUALS[kind];
    const body = this.add.image(0, 0, assetKey(visual.assetId));
    const display = radius * (visual.scale ?? 1.75);
    body.setDisplaySize(display, display);
    if (visual.tint) body.setTint(visual.tint);
    return body;
  }

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const slowUntil = enemy.status.get("slow") ?? 0;
      const burnUntil = enemy.status.get("burn") ?? 0;
      const speedFactor = this.elapsed < slowUntil ? 0.55 : 1;
      const movingBoss = enemy.kind !== "core" && enemy.kind !== "node";
      if (movingBoss) {
        enemy.y += enemy.speed * speedFactor * dt;
      }

      if (this.elapsed < burnUntil && Math.floor(this.elapsed * 5) !== Math.floor((this.elapsed - dt) * 5)) {
        this.damageEnemy(enemy, 3 + this.playerState.abilityPower * 0.06, "burn");
      }

      if (enemy.kind === "ranged" && this.elapsed >= enemy.nextActionAt) {
        enemy.nextActionAt = this.elapsed + 2.1;
        this.fireEnemyProjectile(enemy, 230, 5);
      }

      if (enemy.kind === "mage" && this.elapsed >= enemy.nextActionAt) {
        enemy.nextActionAt = this.elapsed + 4.2;
        this.createLaneWarning(enemy.lane, 525, 134, 1, 11);
      }

      if (enemy.kind === "healer" && this.elapsed >= enemy.nextActionAt) {
        enemy.nextActionAt = this.elapsed + 2.6;
        this.healNearby(enemy);
      }

      if (enemy.kind === "summoner" && this.elapsed >= enemy.nextActionAt) {
        enemy.nextActionAt = this.elapsed + 4.5;
        this.spawnEnemy("melee", this.clampLane(enemy.lane + Phaser.Math.Between(-1, 1)));
        this.showFloatingText(enemy.x, enemy.y - 42, "召唤", "#a5f3fc", 14, 650);
      }

      if (enemy.kind === "assassin" && enemy.y > 430 && Math.abs(enemy.x - this.player.x) < 120) {
        enemy.y += 155 * dt;
      }

      if ((enemy.isBoss || enemy.kind === "node") && this.elapsed >= enemy.nextActionAt) {
        this.bossAction(enemy);
      }

      if (this.distance(enemy.x, enemy.y, this.player.x, PLAYER_Y) < enemy.radius + 26) {
        if (enemy.kind === "assassin" || enemy.kind === "mimic") {
          this.takeDamage(enemy.damage);
          this.killEnemy(enemy, false);
          this.enemies.splice(i, 1);
          continue;
        }
      }

      if (enemy.y > ESCAPE_Y) {
        this.enemyEscaped(enemy);
        this.destroyEnemy(enemy);
        this.enemies.splice(i, 1);
        continue;
      }

      this.updateEnemyVisual(enemy);
    }
  }

  private bossAction(enemy: Enemy) {
    if (enemy.kind === "core") {
      enemy.nextActionAt = this.elapsed + 2.8;
      const lane = this.randomLane();
      this.createLaneWarning(lane, 76, 562, 0.95, 18);
      if (Phaser.Math.FloatBetween(0, 1) < 0.48) {
        this.spawnEnemy(this.elapsed > 285 ? "cannon" : "ranged", this.randomLane());
      }
      return;
    }

    if (enemy.kind === "node") {
      enemy.nextActionAt = this.elapsed + 4.6;
      if (Phaser.Math.FloatBetween(0, 1) < 0.5) {
        this.spawnEnemy("ranged", enemy.lane);
      } else {
        this.fireEnemyProjectile(enemy, 260, 8);
      }
      return;
    }

    enemy.nextActionAt = this.elapsed + Phaser.Math.FloatBetween(3.1, 4.8);
    const sweepCenter = this.clampLane(enemy.lane + Phaser.Math.Between(-1, 1));
    const lanes = new Set([sweepCenter, this.clampLane(sweepCenter + Phaser.Math.Between(-1, 1))]);
    lanes.forEach((lane) => this.createLaneWarning(lane, 350, 248, 1.1, enemy.damage));

    if (Phaser.Math.FloatBetween(0, 1) < 0.35) {
      this.spawnEnemy(this.elapsed > 180 ? "cannon" : "melee", this.randomLane());
    }
  }

  private updateEnemyVisual(enemy: Enemy) {
    enemy.x = LANES[enemy.lane];
    enemy.sprite.setPosition(enemy.x, enemy.y);
    const hpRatio = Phaser.Math.Clamp(enemy.hp / enemy.maxHp, 0, 1);
    enemy.hpBar.width = enemy.radius * 1.6 * hpRatio;
    enemy.hpBar.setFillStyle(
      enemy.hp <= enemy.lastHitWindow ? 0xfacc15 : enemy.isBoss ? 0xef4444 : this.enemySpec(enemy.kind).hpColor,
      1,
    );
    enemy.hpBack.setStrokeStyle(enemy.hp <= enemy.lastHitWindow ? 2 : 0, 0xfacc15, 0.9);
    if (enemy.hp <= enemy.lastHitWindow) {
      enemy.sprite.setScale(1 + Math.sin(this.elapsed * 14) * 0.035);
      enemy.lastHitRing.setVisible(true).setAlpha(0.72 + Math.sin(this.elapsed * 12) * 0.18);
      enemy.lastHitRing.setRotation(this.elapsed * 2.6);
    } else {
      enemy.sprite.setScale(1);
      enemy.lastHitRing.setVisible(false).setAlpha(0);
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.ttl -= dt;

    if (p.targetId && !p.fromEnemy) {
        const target = this.enemies.find((enemy) => enemy.id === p.targetId);
        if (target) {
          const angle = Phaser.Math.Angle.Between(p.x, p.y, target.x, target.y);
          const speed = Math.hypot(p.vx, p.vy);
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.sprite.setPosition(p.x, p.y);
      p.sprite.setRotation(Math.atan2(p.vy, p.vx));

      if (p.fromEnemy) {
        if (this.distance(p.x, p.y, this.player.x, PLAYER_Y) < p.radius + 24) {
          this.takeDamage(p.damage);
          this.destroyProjectile(p);
          this.projectiles.splice(i, 1);
          continue;
        }
      } else {
        for (const enemy of [...this.enemies]) {
          if (p.hit.has(enemy.id)) continue;
          if (this.distance(p.x, p.y, enemy.x, enemy.y) <= p.radius + enemy.radius) {
            p.hit.add(enemy.id);
            this.damageEnemy(enemy, p.damage, p.kind);
            if (p.kind === "auto" && this.playerState.autoBounces > 0 && p.bounce < this.playerState.autoBounces) {
              const next = this.findNearestEnemy(enemy.x, enemy.y, 190, new Set([...p.hit]));
              if (next) {
                this.fireProjectile(enemy.x, enemy.y, next.x, next.y, p.damage * 0.62, "auto", 720, 6, 0xfef08a, 0, next.id, p.bounce + 1);
              }
            }
            p.pierce -= 1;
            if (p.pierce < 0) break;
          }
        }
        if (p.pierce < 0) {
          this.destroyProjectile(p);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      if (p.ttl <= 0 || p.y < -80 || p.y > HEIGHT + 80 || p.x < -80 || p.x > WIDTH + 80) {
        this.destroyProjectile(p);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateWarnings(_: number) {
    for (let i = this.warnings.length - 1; i >= 0; i--) {
      const warning = this.warnings[i];
      const remaining = warning.triggerAt - this.elapsed;
      warning.sprite.setAlpha(Phaser.Math.Clamp(0.2 + Math.sin(this.elapsed * 24) * 0.2, 0.18, 0.55));
      if (remaining <= 0) {
        this.resolveWarning(warning);
        this.warnings.splice(i, 1);
      }
    }
  }

  private resolveWarning(warning: Warning) {
    warning.sprite.destroy();
    const laneX = LANES[warning.lane];
    this.flashLane(warning.lane, 0xf43f5e);
    if (
      Math.abs(this.player.x - laneX) < LANE_WIDTH / 2 + 8 &&
      PLAYER_Y > warning.y &&
      PLAYER_Y < warning.y + warning.h
    ) {
      this.takeDamage(warning.damage);
    }
  }

  private updateAutoAttack() {
    const attackSpeed =
      this.playerState.attackSpeed *
      (this.elapsed < this.playerState.focusUntil ? 1.2 : 1) *
      (this.elapsed < this.playerState.hasteUntil ? 1.35 : 1);
    if (this.elapsed < this.autoReadyAt) return;
    const target = this.pickTarget();
    if (!target) return;

    this.autoReadyAt = this.elapsed + 1 / attackSpeed;
    this.setPlayerPose("attack", 160);
    const crit = Phaser.Math.FloatBetween(0, 1) < this.playerState.critChance;
    let damage = this.playerState.attackDamage * (crit ? this.playerState.critDamage : 1);
    if (this.playerState.empowered) {
      damage *= 1.45;
      this.playerState.empowered = false;
      this.showFloatingText(this.player.x, PLAYER_Y - 48, "强化", "#fef08a", 14, 600);
    }
    if (this.playerState.onHitPercent > 0) {
      damage += target.maxHp * this.playerState.onHitPercent;
    }
    this.fireProjectile(this.player.x, PLAYER_Y - 26, target.x, target.y, damage, "auto", 760, 6, crit ? 0xfacc15 : 0x93c5fd, 0, target.id);
  }

  private pickTarget() {
    let best: Enemy | undefined;
    let bestScore = -Infinity;
    const playerLane = this.nearestLane(this.player.x);

    for (const enemy of this.enemies) {
      if (enemy.y < 18 && !enemy.isBoss) continue;
      const dist = this.distance(this.player.x, PLAYER_Y, enemy.x, enemy.y);
      if (dist > this.playerState.range) continue;
      const laneBonus = enemy.lane === playerLane ? 120 : 0;
      const lowHpBonus = enemy.hp <= this.playerState.attackDamage * 1.1 ? 45 : 0;
      const bottomPressure = enemy.y / 12;
      const score = enemy.priority * 45 + laneBonus + lowHpBonus + bottomPressure - dist * 0.08;
      if (score > bestScore) {
        bestScore = score;
        best = enemy;
      }
    }
    return best;
  }

  private castQ() {
    if (!this.skillReady("Q")) return;
    this.markSkillUsed("Q");
    this.qCasts += 1;
    this.setPlayerPose("attack", 220);
    const lane = this.nearestLane(this.player.x);
    const damage = this.playerState.attackDamage * 1.5 + this.playerState.abilityPower * 0.62 + 18;
    this.fireProjectile(LANES[lane], PLAYER_Y - 42, LANES[lane], -80, damage, "q", 940, 9, 0x38bdf8, this.playerState.qPierce);
    this.playerState.empowered = this.equipment.includes("三相核心型");
    this.flashLane(lane, 0x38bdf8);
  }

  private castR() {
    if (!this.skillReady("R")) return;
    this.markSkillUsed("R");
    this.setPlayerPose("attack", 340);
    this.cameras.main.shake(250, 0.006);
    const targets = [...this.enemies]
      .sort((a, b) => {
        const aScore = (a.hp <= a.lastHitWindow ? 2 : 0) + a.priority;
        const bScore = (b.hp <= b.lastHitWindow ? 2 : 0) + b.priority;
        return bScore - aScore;
      })
      .slice(0, 14);
    targets.forEach((enemy, index) => {
      this.time.delayedCall(index * 55, () => {
        if (!this.enemies.includes(enemy)) return;
        this.createStrike(enemy.x, enemy.y, 0xd8b4fe);
        this.damageEnemy(enemy, 66 + this.playerState.attackDamage * 0.95 + this.playerState.abilityPower * 0.75, "r");
      });
    });
    this.playerState.empowered = this.equipment.includes("三相核心型");
  }

  private skillReady(key: SkillKey) {
    return this.runState === "playing" && this.elapsed >= this.skills[key].readyAt;
  }

  private markSkillUsed(key: SkillKey) {
    const skill = this.skills[key];
    const cdr = Phaser.Math.Clamp(this.playerState.cdr + (this.elapsed < this.playerState.blueBuffUntil ? 0.2 : 0), 0, 0.55);
    skill.readyAt = this.elapsed + skill.cd * (1 - cdr);
  }

  private fireProjectile(
    x: number,
    y: number,
    tx: number,
    ty: number,
    damage: number,
    kind: ProjectileKind,
    speed: number,
    radius: number,
    color: number,
    pierce = 0,
    targetId?: number,
    bounce = 0,
  ) {
    const angle = Phaser.Math.Angle.Between(x, y, tx, ty);
    const shape = this.add.image(x, y, assetKey("VFX_001"));
    const length = kind === "q" ? 58 : kind === "enemy" ? 32 : 34;
    shape
      .setDisplaySize(length, Math.max(12, radius * 2.4))
      .setRotation(angle)
      .setTint(kind === "enemy" ? 0xfb7185 : kind === "q" ? 0x38bdf8 : color)
      .setDepth(kind === "enemy" ? 42 : 45);
    const projectile: Projectile = {
      kind,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      radius,
      color,
      pierce,
      targetId,
      sprite: shape,
      hit: new Set(),
      ttl: 3,
      fromEnemy: kind === "enemy",
      bounce,
    };
    this.projectiles.push(projectile);
    return projectile;
  }

  private fireEnemyProjectile(enemy: Enemy, speed: number, damage: number) {
    this.fireProjectile(enemy.x, enemy.y + 18, this.player.x, PLAYER_Y, damage, "enemy", speed, 7, 0xfb7185);
  }

  private damageEnemy(enemy: Enemy, amount: number, kind: ProjectileKind) {
    let damage = amount;
    if (enemy.kind === "core") {
      const nodesAlive = this.enemies.some((target) => target.kind === "node");
      if (nodesAlive) {
        damage *= 0.3;
      }
    }

    if (kind === "q" && this.playerState.qSplashes) {
      this.enemies.forEach((nearby) => {
        if (nearby.id !== enemy.id && this.distance(enemy.x, enemy.y, nearby.x, nearby.y) < 112) {
          nearby.hp -= damage * 0.32;
          this.createSpark(nearby.x, nearby.y, 0x8b5cf6);
        }
      });
    }

    if (kind === "q" && this.playerState.frostSkill) {
      enemy.status.set("slow", this.elapsed + 2.1);
    }

    if ((this.playerState.onHitBurn || this.elapsed < this.playerState.burnBuffUntil) && (kind === "auto" || kind === "q")) {
      enemy.status.set("burn", this.elapsed + 3.2);
    }

    enemy.hp -= damage;
    this.createSpark(enemy.x, enemy.y, kind === "auto" ? 0xfef08a : kind === "q" ? 0x38bdf8 : kind === "r" ? 0xd8b4fe : 0xfb923c);

    if (this.playerState.lifesteal > 0 && kind !== "burn" && kind !== "aura") {
      const heal = damage * this.playerState.lifesteal;
      this.playerState.hp = Math.min(this.playerState.maxHp, this.playerState.hp + heal);
      if (this.playerState.hp >= this.playerState.maxHp && this.equipment.includes("饮血剑型")) {
        this.playerState.shield = Math.min(this.playerState.maxHp * 0.28, this.playerState.shield + heal * 0.4);
      }
    }

    if (enemy.hp <= 0) {
      this.killEnemy(enemy, true, kind);
      this.destroyEnemy(enemy);
      Phaser.Utils.Array.Remove(this.enemies, enemy);
    }
  }

  private killEnemy(enemy: Enemy, playerKill: boolean, kind: ProjectileKind = "auto") {
    if (!playerKill) return;
    const perfect = enemy.hp <= 0 && enemy.hp + this.playerState.attackDamage * 1.25 >= 0 && kind === "auto";
    const goldBonus = enemy.isBoss ? (perfect ? 1 + this.playerState.comboGoldBonus : 1) : perfect ? 1 + this.playerState.comboGoldBonus : 0.55;
    const gainedGold = Math.round(enemy.gold * goldBonus);
    this.playerState.gold += gainedGold;
    this.playerState.xp += enemy.xp;
    this.playerState.cs += enemy.isChest || enemy.isResource || enemy.isBoss ? 0 : 1;
    this.playerState.combo += 1;
    this.playerState.comboBest = Math.max(this.playerState.comboBest, this.playerState.combo);
    if (this.playerState.combo >= 10) {
      this.playerState.focusUntil = this.elapsed + 5;
    }

    this.showFloatingText(enemy.x, enemy.y - enemy.radius - 12, perfect ? `补刀 +${gainedGold}` : `+${gainedGold}`, perfect ? "#facc15" : "#fde68a", perfect ? 17 : 14, 760);
    this.rollDrop(enemy);
    this.celebrateMajorKill(enemy, gainedGold);
    this.handleSpecialKill(enemy);
    this.tryLevelUp();
    this.tryCraftEquipment();
  }

  private celebrateMajorKill(enemy: Enemy, gainedGold: number) {
    const isDragon = enemy.kind === "dragonFire" || enemy.kind === "dragonIce" || enemy.kind === "dragonStorm";
    const isSuper = enemy.kind === "super";
    const isBaron = enemy.kind === "baron";
    const isCore = enemy.kind === "core";
    if (!isSuper && !isDragon && !isBaron && !isCore) return;

    const config = isBaron
      ? { shakeMs: 560, intensity: 0.014, extraGold: 160, materials: 4, coins: 18, flash: true, size: 176 }
      : isDragon
        ? { shakeMs: 420, intensity: 0.01, extraGold: 90, materials: 3, coins: 14, flash: true, size: 148 }
        : isCore
          ? { shakeMs: 620, intensity: 0.016, extraGold: 260, materials: 0, coins: 22, flash: true, size: 210 }
          : { shakeMs: 320, intensity: 0.008, extraGold: 60, materials: 1, coins: 10, flash: false, size: 118 };

    this.cameras.main.shake(config.shakeMs, config.intensity);
    if (config.flash) this.cameras.main.flash(220, 255, 244, 180, false);
    this.createBurst(enemy.x, enemy.y, config.size);
    if (isDragon || isBaron || isCore) {
      this.time.delayedCall(90, () => this.createBurst(enemy.x, enemy.y, config.size * 0.72));
    }
    this.createGoldBurst(enemy.x, enemy.y, config.coins);

    if (config.extraGold > 0) {
      this.playerState.gold += config.extraGold;
      this.showFloatingText(enemy.x, enemy.y - enemy.radius - 44, `爆钱 +${config.extraGold}`, "#facc15", isCore ? 24 : 20, 1100);
    } else if (gainedGold > 0) {
      this.showFloatingText(enemy.x, enemy.y - enemy.radius - 44, `金币 +${gainedGold}`, "#facc15", 19, 1000);
    }

    for (let i = 0; i < config.materials; i += 1) {
      this.addMaterial(this.randomMaterial(), enemy.x, enemy.y + Phaser.Math.Between(-16, 16));
    }
  }

  private rollDrop(enemy: Enemy) {
    if (enemy.isChest) {
      this.createBurst(enemy.x, enemy.y, enemy.kind === "goldChest" ? 112 : 84);
    }
    const materialChance =
      enemy.kind === "cannon" || enemy.kind === "super"
        ? 0.7
        : enemy.isChest
          ? enemy.kind === "goldChest"
            ? 1
            : 0.58
          : enemy.isBoss
            ? 1
            : enemy.isResource
              ? 0.45
              : 0.06;
    if (Phaser.Math.FloatBetween(0, 1) < materialChance) {
      const count = enemy.kind === "goldChest" || enemy.isBoss ? 2 : 1;
      for (let i = 0; i < count; i++) this.addMaterial(this.randomMaterial());
    }

    if (enemy.kind === "goldChest" && Phaser.Math.FloatBetween(0, 1) < 0.12) {
      this.openUpgradeChoice();
    } else if (enemy.kind === "chest" && Phaser.Math.FloatBetween(0, 1) < 0.12) {
      this.spawnEnemy("mimic", enemy.lane);
    }
  }

  private handleSpecialKill(enemy: Enemy) {
    if (enemy.kind === "resourceRed") {
      this.playerState.burnBuffUntil = this.elapsed + 20;
      this.showFloatingText(enemy.x, enemy.y, "红 Buff", "#fb7185", 18, 1100);
    }
    if (enemy.kind === "resourceBlue") {
      this.playerState.blueBuffUntil = this.elapsed + 20;
      this.showFloatingText(enemy.x, enemy.y, "蓝 Buff", "#93c5fd", 18, 1100);
    }
    if (enemy.kind === "vision") {
      this.spawnTimer = 0.05;
      this.showFloatingText(enemy.x, enemy.y, "预知下一波", "#99f6e4", 17, 1100);
    }
    if (enemy.kind === "dragonFire") {
      this.playerState.onHitBurn = true;
      this.playerState.attackDamage += 6;
      this.openUpgradeChoice();
    }
    if (enemy.kind === "dragonIce") {
      this.playerState.frostSkill = true;
      this.playerState.maxHp += 16;
      this.playerState.hp += 16;
      this.openUpgradeChoice();
    }
    if (enemy.kind === "baron") {
      this.playerState.attackSpeed += 0.25;
      this.playerState.attackDamage += 14;
      this.crystalHp = Math.min(this.maxCrystalHp, this.crystalHp + 18);
      this.showFloatingText(WIDTH / 2, 120, "大龙强化", "#e9d5ff", 24, 1400);
    }
    if (enemy.kind === "core") {
      this.finalCoreKilled = true;
      this.win();
    }
  }

  private addMaterial(material: Material, x = this.player.x, y = PLAYER_Y - 84) {
    this.materials.set(material, (this.materials.get(material) ?? 0) + 1);
    this.showFloatingText(x, y, material, "#c4b5fd", 13, 720);
  }

  private tryCraftEquipment() {
    if (this.equipment.length >= 6) return;
    for (const recipe of this.recipes) {
      if (this.equipment.includes(recipe.name)) continue;
      if (this.canCraft(recipe.needs)) {
        recipe.needs.forEach((mat) => this.materials.set(mat, (this.materials.get(mat) ?? 0) - 1));
        this.equipment.push(recipe.name);
        recipe.apply();
        this.showFloatingText(WIDTH / 2, 520, `合成 ${recipe.name}`, "#fef3c7", 22, 1200);
        this.cameras.main.flash(120, 250, 225, 120, false);
        break;
      }
    }
  }

  private canCraft(needs: Material[]) {
    const counts = new Map<Material, number>();
    needs.forEach((mat) => counts.set(mat, (counts.get(mat) ?? 0) + 1));
    return [...counts.entries()].every(([mat, count]) => (this.materials.get(mat) ?? 0) >= count);
  }

  private randomMaterial(): Material {
    const mats: Material[] = [
      "长剑",
      "反曲弓",
      "暴击手套",
      "蓝水晶",
      "法杖",
      "生命宝石",
      "护甲片",
      "吸血石",
      "冷却齿轮",
      "速度靴",
    ];
    return Phaser.Utils.Array.GetRandom(mats);
  }

  private tryLevelUp() {
    let needed = this.xpNeeded();
    while (this.playerState.xp >= needed) {
      this.playerState.xp -= needed;
      this.playerState.level += 1;
      this.playerState.maxHp += 8;
      this.playerState.hp = Math.min(this.playerState.maxHp, this.playerState.hp + 18);
      this.openUpgradeChoice();
      needed = this.xpNeeded();
      if (this.runState === "upgrade") break;
    }
  }

  private xpNeeded() {
    return 80 + (this.playerState.level - 1) * 32;
  }

  private openUpgradeChoice() {
    if (this.runState !== "playing") return;
    this.runState = "upgrade";
    const choices = this.makeUpgradeChoices();
    const overlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x020617, 0.74);
    const panel = this.add.rectangle(WIDTH / 2, HEIGHT / 2, 730, 328, 0x111827, 0.98);
    panel.setStrokeStyle(2, 0xfacc15, 0.8);
    const title = this.add
      .text(WIDTH / 2, HEIGHT / 2 - 128, "选择强化", {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "26px",
        color: "#fef3c7",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const nodes: Phaser.GameObjects.GameObject[] = [overlay, panel, title];

    choices.forEach((choice, index) => {
      const x = WIDTH / 2 - 230 + index * 230;
      const rarityColor = this.rarityColor(choice.rarity);
      const cardAsset: AssetId = choice.rarity === "普通" ? "UI_007" : "UI_008";
      const card = this.add
        .image(x, HEIGHT / 2 + 18, assetKey(cardAsset))
        .setDisplaySize(204, 274)
        .setTint(choice.rarity === "史诗" ? 0xd8b4fe : choice.rarity === "传说" ? 0xfacc15 : 0xffffff);
      const rarity = this.add
        .text(x, HEIGHT / 2 - 88, choice.rarity, {
          fontFamily: "Arial, PingFang SC, sans-serif",
          fontSize: "14px",
          color: Phaser.Display.Color.ValueToColor(rarityColor).rgba,
        })
        .setOrigin(0.5);
      const titleText = this.add
        .text(x, HEIGHT / 2 - 50, choice.title, {
          fontFamily: "Arial, PingFang SC, sans-serif",
          fontSize: "20px",
          color: "#f8fafc",
          fontStyle: "bold",
          align: "center",
          wordWrap: { width: 174 },
        })
        .setOrigin(0.5);
      const desc = this.add
        .text(x, HEIGHT / 2 + 34, choice.description, {
          fontFamily: "Arial, PingFang SC, sans-serif",
          fontSize: "14px",
          color: "#cbd5e1",
          align: "center",
          wordWrap: { width: 168 },
        })
        .setOrigin(0.5);
      const number = this.add
        .text(x, HEIGHT / 2 + 116, `${index + 1}`, {
          fontFamily: "Arial, PingFang SC, sans-serif",
          fontSize: "18px",
          color: "#fef3c7",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      card.setInteractive({ useHandCursor: true });
      card.on("pointerdown", () => this.chooseUpgrade(choice));
      nodes.push(card, rarity, titleText, desc, number);
    });

    this.upgradePanel = this.add.container(0, 0, nodes);
    this.upgradePanel.setDepth(200);

    const selectByKey = (index: number) => {
      if (this.runState === "upgrade" && choices[index]) this.chooseUpgrade(choices[index]);
    };
    this.input.keyboard?.once("keydown-ONE", () => selectByKey(0));
    this.input.keyboard?.once("keydown-TWO", () => selectByKey(1));
    this.input.keyboard?.once("keydown-THREE", () => selectByKey(2));
  }

  private chooseUpgrade(choice: Upgrade) {
    choice.apply();
    this.showFloatingText(WIDTH / 2, 468, choice.title, "#fef3c7", 20, 900);
    this.upgradePanel?.destroy(true);
    this.upgradePanel = undefined;
    this.runState = "playing";
  }

  private makeUpgradeChoices(): Upgrade[] {
    const pool: Upgrade[] = [
      {
        title: "锋利箭头",
        rarity: "普通",
        description: "攻击力 +15%，补刀窗口更宽。",
        apply: () => {
          this.playerState.attackDamage *= 1.15;
        },
      },
      {
        title: "急速清线",
        rarity: "普通",
        description: "攻速 +12%，移动速度 +6%。",
        apply: () => {
          this.playerState.attackSpeed += 0.12;
          this.playerState.moveSpeed += 18;
        },
      },
      {
        title: "奥术刻印",
        rarity: "普通",
        description: "技能强度 +22，Q 与 R 伤害提高。",
        apply: () => {
          this.playerState.abilityPower += 22;
        },
      },
      {
        title: "守线韧性",
        rarity: "普通",
        description: "最大生命 +28，并立即治疗 28。",
        apply: () => {
          this.playerState.maxHp += 28;
          this.playerState.hp = Math.min(this.playerState.maxHp, this.playerState.hp + 28);
        },
      },
      {
        title: "连补专注",
        rarity: "稀有",
        description: "补刀金币 +20%，连击 10 后专注更久。",
        apply: () => {
          this.playerState.comboGoldBonus += 0.2;
        },
      },
      {
        title: "穿透箭袋",
        rarity: "稀有",
        description: "Q 穿透目标 +2，冷却缩减 +5%。",
        apply: () => {
          this.playerState.qPierce += 2;
          this.playerState.cdr += 0.05;
        },
      },
      {
        title: "弹射普攻",
        rarity: "史诗",
        description: "普攻会弹射 1 次，弹射造成部分伤害。",
        apply: () => {
          this.playerState.autoBounces += 1;
        },
      },
      {
        title: "烈焰补刀",
        rarity: "史诗",
        description: "普攻和 Q 附带燃烧，适合高血量目标。",
        apply: () => {
          this.playerState.onHitBurn = true;
        },
      },
      {
        title: "冷却齿轮",
        rarity: "稀有",
        description: "冷却缩减 +10%，Q 与 R 更快轮转。",
        apply: () => {
          this.playerState.cdr += 0.1;
        },
      },
      {
        title: "吸血狩猎",
        rarity: "稀有",
        description: "吸血 +7%，攻速 +8%。",
        apply: () => {
          this.playerState.lifesteal += 0.07;
          this.playerState.attackSpeed += 0.08;
        },
      },
      {
        title: "水晶保险",
        rarity: "稀有",
        description: "己方水晶恢复 20，漏刀压力降低。",
        apply: () => {
          this.crystalHp = Math.min(this.maxCrystalHp, this.crystalHp + 20);
        },
      },
      {
        title: "传说斩击",
        rarity: "传说",
        description: "暴击率 +18%，暴击伤害 +50%。",
        apply: () => {
          this.playerState.critChance += 0.18;
          this.playerState.critDamage += 0.5;
        },
      },
    ];

    Phaser.Utils.Array.Shuffle(pool);
    const picks: Upgrade[] = [];
    for (const upgrade of pool) {
      if (!picks.some((p) => p.title === upgrade.title)) picks.push(upgrade);
      if (picks.length === 3) break;
    }
    return picks;
  }

  private rarityColor(rarity: Upgrade["rarity"]) {
    if (rarity === "普通") return 0x94a3b8;
    if (rarity === "稀有") return 0x38bdf8;
    if (rarity === "史诗") return 0xc084fc;
    return 0xfacc15;
  }

  private enemyEscaped(enemy: Enemy) {
    if (enemy.escapedDamage > 0) {
      this.crystalHp -= enemy.escapedDamage;
      this.playerState.missed += 1;
      this.playerState.combo = 0;
      this.showFloatingText(enemy.x, 650, `漏刀 -${enemy.escapedDamage}`, "#fb7185", 16, 820);
      this.cameras.main.shake(140, 0.0035);
    }
  }

  private healNearby(healer: Enemy) {
    this.createSpark(healer.x, healer.y, 0x4ade80);
    this.enemies.forEach((enemy) => {
      if (enemy.id !== healer.id && this.distance(enemy.x, enemy.y, healer.x, healer.y) < 150) {
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + 12 + this.elapsed * 0.03);
      }
    });
  }

  private updateAuras(dt: number) {
    this.playerCore.setFillStyle(this.elapsed < this.playerState.invulnerableUntil ? 0xe0f2fe : 0x38bdf8, 1);
    this.playerAura.setScale(1 + Math.sin(this.elapsed * 5) * 0.04);
    this.shieldImage
      .setVisible(this.playerState.shield > 0)
      .setAlpha(this.playerState.shield > 0 ? 0.42 + Math.sin(this.elapsed * 8) * 0.12 : 0)
      .setRotation(this.elapsed * 0.8);
    this.playerImage.setTint(this.elapsed < this.playerState.invulnerableUntil ? 0xdbeafe : 0xffffff);

    if (this.playerState.shield > 0) {
      this.playerState.shield = Math.max(0, this.playerState.shield - dt * 1.8);
    }

    if (this.playerState.aura && Math.floor(this.elapsed * 2) !== Math.floor((this.elapsed - dt) * 2)) {
      this.enemies.forEach((enemy) => {
        if (this.distance(enemy.x, enemy.y, this.player.x, PLAYER_Y) < 128) {
          this.damageEnemy(enemy, 8 + this.playerState.maxHp * 0.025, "aura");
        }
      });
      this.createSpark(this.player.x, PLAYER_Y, 0xfb923c);
    }
  }

  private takeDamage(amount: number) {
    if (this.elapsed < this.playerState.invulnerableUntil) return;
    let remaining = amount;
    if (this.playerState.shield > 0) {
      const absorbed = Math.min(this.playerState.shield, remaining);
      this.playerState.shield -= absorbed;
      remaining -= absorbed;
    }
    if (remaining > 0) {
      this.playerState.hp -= remaining;
      this.playerCore.setFillStyle(0xfb7185, 1);
      this.playerImage.setTint(0xfb7185);
      this.time.delayedCall(120, () => {
        this.playerCore.setFillStyle(0x38bdf8, 1);
        if (this.playerImage?.active) this.playerImage.setTint(0xffffff);
      });
      this.cameras.main.shake(110, 0.003);
    }

    if (this.playerState.hp <= 0 && this.playerState.revive) {
      this.playerState.revive = false;
      this.playerState.hp = this.playerState.maxHp * 0.5;
      this.playerState.invulnerableUntil = this.elapsed + 2;
      this.showFloatingText(this.player.x, PLAYER_Y - 68, "复活", "#fef3c7", 24, 1300);
    }
  }

  private createLaneWarning(lane: number, y: number, h: number, delay: number, damage: number) {
    const sprite = this.add
      .image(LANES[lane], y + h / 2, assetKey("VFX_003"))
      .setDisplaySize(LANE_WIDTH - 8, h)
      .setAlpha(0.34)
      .setDepth(18);
    this.warnings.push({
      lane,
      y,
      h,
      triggerAt: this.elapsed + delay,
      damage,
      sprite,
    });
  }

  private flashLane(lane: number, color: number) {
    const flash = this.add.rectangle(LANES[lane], 352, LANE_WIDTH - 4, 592, color, 0.16);
    flash.setDepth(17);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 260,
      onComplete: () => flash.destroy(),
    });
  }

  private createStrike(x: number, y: number, color: number) {
    const line = this.add.image(x, y - 44, assetKey("SKILL_R_001")).setDisplaySize(82, 82).setTint(color);
    line.setDepth(48);
    const impact = this.add.image(x, y, assetKey("VFX_006")).setDisplaySize(82, 82).setAlpha(0.56).setDepth(47);
    this.tweens.add({
      targets: [line, impact],
      alpha: 0,
      scaleX: 1.6,
      scaleY: 1.25,
      duration: 260,
      onComplete: () => {
        line.destroy();
        impact.destroy();
      },
    });
  }

  private createSpark(x: number, y: number, color: number) {
    const spark = this.add.image(x, y, assetKey("VFX_002")).setDisplaySize(42, 42).setTint(color).setAlpha(0.86);
    spark.setDepth(60);
    this.particles.push(spark);
    this.tweens.add({
      targets: spark,
      alpha: 0,
      scale: 2.1,
      duration: 260,
      onComplete: () => {
        Phaser.Utils.Array.Remove(this.particles, spark);
        spark.destroy();
      },
    });
  }

  private createBurst(x: number, y: number, size: number) {
    const burst = this.add.image(x, y, assetKey("VFX_005")).setDisplaySize(size, size).setAlpha(0.76);
    burst.setDepth(58);
    this.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 1.8,
      duration: 420,
      ease: "Cubic.easeOut",
      onComplete: () => burst.destroy(),
    });
  }

  private createGoldBurst(x: number, y: number, count: number) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.22, 0.22);
      const distance = Phaser.Math.Between(58, 132);
      const coin = this.add
        .image(x, y, assetKey("PICKUP_001"))
        .setDisplaySize(24, 24)
        .setTint(0xfacc15)
        .setDepth(62)
        .setAlpha(0.95);
      this.tweens.add({
        targets: coin,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance + Phaser.Math.Between(-18, 26),
        alpha: 0,
        scale: 0.45,
        duration: Phaser.Math.Between(520, 760),
        ease: "Cubic.easeOut",
        onComplete: () => coin.destroy(),
      });
    }
  }

  private showFloatingText(x: number, y: number, text: string, color: string, size = 15, duration = 720) {
    const label = this.add
      .text(x, y, text, {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: `${size}px`,
        color,
        fontStyle: "bold",
        stroke: "#020617",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(120);
    this.floatingTexts.push(label);
    this.tweens.add({
      targets: label,
      y: y - 32,
      alpha: 0,
      duration,
      ease: "Cubic.easeOut",
      onComplete: () => {
        Phaser.Utils.Array.Remove(this.floatingTexts, label);
        label.destroy();
      },
    });
  }

  private updateEffects(_: number) {
    this.effectsGraphics.clear();
    if (this.elapsed < this.playerState.burnBuffUntil) {
      this.effectsGraphics.lineStyle(3, 0xfb7185, 0.5);
      this.effectsGraphics.strokeCircle(this.player.x, PLAYER_Y, 42 + Math.sin(this.elapsed * 8) * 4);
    }
    if (this.elapsed < this.playerState.blueBuffUntil) {
      this.effectsGraphics.lineStyle(3, 0x60a5fa, 0.5);
      this.effectsGraphics.strokeCircle(this.player.x, PLAYER_Y, 50 + Math.cos(this.elapsed * 7) * 4);
    }
  }

  private updateHud() {
    this.updatePauseButton();
    const hp = Math.max(0, Math.round(this.playerState.hp));
    const shield = Math.round(this.playerState.shield);
    this.playerHpText.setText(`生命 ${hp}/${Math.round(this.playerState.maxHp)}  护盾 ${shield}  Lv.${this.playerState.level}`);

    const remain = Math.max(0, DURATION - this.elapsed);
    const min = Math.floor(remain / 60);
    const sec = Math.floor(remain % 60)
      .toString()
      .padStart(2, "0");
    this.timerText.setText(`${min}:${sec}`);

    this.economyText.setText(`金币 ${this.playerState.gold}  补刀 ${this.playerState.cs}  漏刀 ${this.playerState.missed}`);
    this.comboText.setText(this.playerState.combo > 1 ? `${this.playerState.combo} Combo` : "");

    const xpRatio = Phaser.Math.Clamp(this.playerState.xp / this.xpNeeded(), 0, 1);
    this.xpBar.width = 180 * xpRatio;

    const crystalRatio = Phaser.Math.Clamp(this.crystalHp / this.maxCrystalHp, 0, 1);
    this.crystalBar.width = 540 * crystalRatio;
    this.crystalBar.setFillStyle(crystalRatio < 0.35 ? 0xfb7185 : crystalRatio < 0.65 ? 0xfacc15 : 0x22c55e, 1);
    this.crystalText.setText(`己方水晶 ${Math.max(0, Math.round(this.crystalHp))}/${this.maxCrystalHp}`);

    const boss = this.bossEnemy && this.enemies.includes(this.bossEnemy) ? this.bossEnemy : this.enemies.find((enemy) => enemy.isBoss);
    if (boss) {
      const ratio = Phaser.Math.Clamp(boss.hp / boss.maxHp, 0, 1);
      this.bossBarBack.setVisible(true);
      this.bossBar.setVisible(true);
      this.bossText.setVisible(true);
      this.bossBar.width = 520 * ratio;
      this.bossText.setText(`${boss.label.text} ${Math.ceil(boss.hp)}/${Math.ceil(boss.maxHp)}`);
    } else {
      this.bossBarBack.setVisible(false);
      this.bossBar.setVisible(false);
      this.bossText.setVisible(false);
    }

    const next = this.eventSchedule.find((event) => !event.done);
    if (next) {
      const delta = Math.max(0, next.time - this.elapsed);
      this.eventText.setText(`下一事件 ${next.name} ${Math.ceil(delta)}s`);
    } else {
      this.eventText.setText(this.finalCoreKilled ? "核心已击破" : "最终战");
    }

    this.syncMaterialHud();
    this.syncEquipmentHud();

    (Object.keys(this.skills) as SkillKey[]).forEach((key) => {
      const remaining = this.skills[key].readyAt - this.elapsed;
      const text = this.skillCooldownTexts.get(key);
      text?.setText(remaining > 0 ? remaining.toFixed(1) : "");
      this.skillTexts.get(key)?.setAlpha(remaining > 0 ? 0.45 : 1);
      this.skillIconImages.get(key)?.setAlpha(remaining > 0 ? 0.38 : 1);
    });
  }

  private syncMaterialHud() {
    const entries = [...this.materials.entries()].filter(([, count]) => count > 0);
    const signature = entries.map(([mat, count]) => `${mat}:${count}`).join("|");
    if (signature === this.materialHudSignature) return;
    this.materialHudSignature = signature;
    this.materialHud.removeAll(true);

    if (entries.length === 0) {
      const empty = this.add.text(0, 0, "-", {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "13px",
        color: "#94a3b8",
      });
      this.materialHud.add(empty);
      return;
    }

    entries.slice(0, 8).forEach(([mat, count], index) => {
      const x = (index % 4) * 58;
      const y = Math.floor(index / 4) * 34;
      const icon = this.add.image(x, y, assetKey(MATERIAL_ASSETS[mat])).setDisplaySize(28, 28);
      const label = this.add
        .text(x + 16, y + 8, `${count}`, {
          fontFamily: "Arial, PingFang SC, sans-serif",
          fontSize: "13px",
          color: "#f8fafc",
          fontStyle: "bold",
          stroke: "#020617",
          strokeThickness: 3,
        })
        .setOrigin(0, 0.5);
      this.materialHud.add([icon, label]);
    });
  }

  private syncEquipmentHud() {
    const signature = this.equipment.join("|");
    if (signature === this.equipmentHudSignature) return;
    this.equipmentHudSignature = signature;
    this.equipmentHud.removeAll(true);

    for (let i = 0; i < 6; i += 1) {
      const x = i * 42;
      const frame = this.add.image(x, 0, assetKey("UI_003")).setDisplaySize(38, 38).setAlpha(0.86);
      this.equipmentHud.add(frame);
      const itemName = this.equipment[i];
      const itemAsset = itemName ? EQUIPMENT_ASSETS[itemName] : undefined;
      if (itemAsset) {
        const icon = this.add.image(x, 0, assetKey(itemAsset)).setDisplaySize(30, 30);
        this.equipmentHud.add(icon);
      }
    }
  }

  private checkWinLoss() {
    if (this.crystalHp <= 0) {
      this.lose("己方水晶被破");
      return;
    }
    if (this.playerState.hp <= 0) {
      this.lose("猎人倒下");
      return;
    }
    if (this.elapsed >= DURATION && !this.finalCoreKilled) {
      this.lose("时间耗尽");
    }
  }

  private win() {
    if (this.runState === "won") return;
    this.runState = "won";
    this.cameras.main.flash(420, 250, 220, 120);
    this.showResult("胜利", "敌方核心已击破", "#fef3c7");
  }

  private lose(reason: string) {
    if (this.runState === "lost") return;
    this.runState = "lost";
    this.showResult("失败", reason, "#fecaca");
  }

  private showResult(title: string, reason: string, color: string) {
    this.resultPanel?.destroy(true);
    const overlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x020617, 0.72);
    const panel = this.add.rectangle(WIDTH / 2, HEIGHT / 2, 520, 294, 0x111827, 0.98);
    panel.setStrokeStyle(2, title === "胜利" ? 0xfacc15 : 0xfb7185, 0.9);
    const titleText = this.add
      .text(WIDTH / 2, HEIGHT / 2 - 94, title, {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "42px",
        color,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const reasonText = this.add
      .text(WIDTH / 2, HEIGHT / 2 - 38, reason, {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "20px",
        color: "#e5e7eb",
      })
      .setOrigin(0.5);
    const stats = this.add
      .text(
        WIDTH / 2,
        HEIGHT / 2 + 36,
        `等级 ${this.playerState.level}   金币 ${this.playerState.gold}   补刀 ${this.playerState.cs}\n最高连击 ${this.playerState.comboBest}   装备 ${this.equipment.length}/6`,
        {
          fontFamily: "Arial, PingFang SC, sans-serif",
          fontSize: "18px",
          color: "#cbd5e1",
          align: "center",
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);
    const replay = this.add
      .text(WIDTH / 2, HEIGHT / 2 + 112, "Space", {
        fontFamily: "Arial, PingFang SC, sans-serif",
        fontSize: "20px",
        color: "#fef3c7",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.resultPanel = this.add.container(0, 0, [overlay, panel, titleText, reasonText, stats, replay]);
    this.resultPanel.setDepth(210);
  }

  private findNearestEnemy(x: number, y: number, radius: number, exclude = new Set<number>()) {
    let best: Enemy | undefined;
    let bestDist = Infinity;
    this.enemies.forEach((enemy) => {
      if (exclude.has(enemy.id)) return;
      const dist = this.distance(x, y, enemy.x, enemy.y);
      if (dist < radius && dist < bestDist) {
        best = enemy;
        bestDist = dist;
      }
    });
    return best;
  }

  private nearestLane(x: number) {
    let best = 0;
    let bestDist = Infinity;
    LANES.forEach((laneX, index) => {
      const dist = Math.abs(x - laneX);
      if (dist < bestDist) {
        best = index;
        bestDist = dist;
      }
    });
    return best;
  }

  private randomLane() {
    return Phaser.Math.Between(0, LAST_LANE);
  }

  private clampLane(lane: number) {
    return Phaser.Math.Clamp(lane, 0, LAST_LANE);
  }

  private distance(x1: number, y1: number, x2: number, y2: number) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  private destroyEnemy(enemy: Enemy) {
    if (this.bossEnemy?.id === enemy.id) this.bossEnemy = undefined;
    enemy.sprite.destroy(true);
  }

  private destroyProjectile(projectile: Projectile) {
    projectile.sprite.destroy();
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: "game",
  backgroundColor: "#070a12",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WIDTH,
    height: HEIGHT,
  },
  scene: ConveyorHunterScene,
  render: {
    antialias: true,
    pixelArt: false,
  },
};

new Phaser.Game(config);
