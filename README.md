# ⚔️ ASHEN BLADE — Director's Cut (3D Browser Boss Duel)

> 🏆 **Hackathon Submission | Built with AI-Assisted Rapid Prototyping**
> 
> **ASHEN BLADE** was conceived, architected, and built during a hackathon using an AI-assisted development workflow. By combining creative direction, prompt engineering, and iterative code refinement with AI, this project pushes the limits of what can be built in a browser under tight hackathon time constraints—achieving a complete 3D action game with **zero external 3D models, textures, or audio files**.

🔗 **[Play the Live Demo Here](https://Akshit0809.github.io/ashen-blade/)** 

---

## 🚀 About the Project & Hackathon Challenge

Most 3D web games rely on hundreds of megabytes of external `.glb` models, `.png` textures, and `.mp3` soundtracks. For this hackathon, the goal was to build a self-contained, high-octane 3D anime boss-duel game in pure code (`index.html`, `style.css`, and `game.js`):

* **100% Procedural 3D Geometry & Kinematics:** Every character, weapon, arena monolith, and the 28-segment articulated dragon is sculpted mathematically in real-time using Three.js primitives and custom sine-wave kinematics.
* **Procedural 1024x1024 Canvas Textures & Post-Processing:** High-DPI stone tiles, dragon scales, ACES Filmic Tone Mapping, and `UnrealBloomPass` neon shaders generated on the fly.
* **Custom Web Audio API Synthesizer:** All katana air-whooshes, temple bell parries, energy beams, Taiko drums, and sub-bass dragon roars are synthesized procedurally in the browser using pink-noise filters and oscillators.
* **Cinematic Storytelling:** Features a 15-second 4-act opening lore cutscene, a mid-fight Phase 2 boss transformation cinematic, and slow-motion victory/defeat finale animations.

---

## 🎮 Playable Fighters (`[TAB]` to Hot-Swap Anytime)

1. **Toji Fushiguro (*The Sorcerer Killer*)**
   * **Visuals:** Muscular compression outfit, spiky black hair, coiled 16-segment Inventory Curse spirit, and the **Inverted Spear of Heaven**.
   * **Signature Arts:** *Spear Nullify Wave*, *Zero-Curse Blink Ambush*, *Heavenly Pact Resolve*, and *Chain of a Thousand Miles*.
2. **Son Goku (*Super Saiyan Legend*)**
   * **Visuals:** Iconic Turtle Hermit Gi, glowing golden Super Saiyan spikes, fiery Ki aura cone, and the **Nyoibo (Power Pole)**.
   * **Signature Arts:** *Kamehameha Energy Beam*, *Instant Transmission Sledgehammer*, *Kaioken Shield*, and *Super Spirit Bomb (Genki Dama)*.
3. **Satoru Gojo (*The Honored One*)**
   * **Visuals:** Jujutsu High uniform, signature blindfold, snow-white spiky hair, and orbiting Red & Blue Limitless orbs.
   * **Signature Arts:** *Black Flash (Kokusen)*, *Lapse: Blue (Ao)*, *Reversal: Red (Aka)*, *Limitless: Infinity Ward*, and *Hollow Technique: Purple (Murasaki)*.

---

## 🐉 The Boss: Kagu-Ryu, Ancient Storm Dragon

* **Phase I — Special-Grade Awakening:** Coiling storm lightning arcs, sweeping claw lunges, and deflectable fireballs.
* **Phase II — Abyssal Void Nightmare (1.5x HP Pool):** When Phase I HP is depleted, Kagu-Ryu mutates into an Abyssal Calamity with 6 glowing eyes, a spinning Void Halo crown, jagged rib-horns, meteor rain, and a sweeping molten laser breath beam.

---

## 🕹️ Controls

| Input | Action |
| :--- | :--- |
| **WASD** | Move Character (Camera-Relative) |
| **Mouse** | 360° Over-the-Shoulder Aim & Camera |
| **Left Click** | 3-Hit Signature Weapon / Martial Arts Combo |
| **Right Click** | Timed Deflect / Parry Incoming Fireballs |
| **Space** | High-Speed Flash Step / Dodge (Invulnerability Frames) |
| **1 / 2 / 3 / 4** | Cast Signature Anime Techniques & Ultimates |
| **TAB** | Switch Playable Fighter Live (Toji / Goku / Gojo) |
| **C** | Replay 15-Second 4-Act Story Cutscene |

---

## 🛠️ Tech Stack
* **3D Engine:** Three.js (`v0.160.0` via ES Module CDN)
* **Post-Processing:** `EffectComposer`, `RenderPass`, `UnrealBloomPass`
* **Audio:** Web Audio API (Procedural Oscillators & Biquad Noise Filters)
* **Frontend:** Vanilla HTML5, CSS3 (3D Perspective Parallax & Keyframe Shimmers), ES6 JavaScript
* **Development Methodology:** AI-Assisted Rapid Prototyping & Iterative Prompt Engineering
