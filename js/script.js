// ============================================================
// Landing page 點矩陣互動：
// 滑過技能點會顯示技能名稱，全部滑過一輪後矩陣淡出、
// 出現點陣雲霄飛車動畫；滑鼠離開 landing page 就整個重置。
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const SKILLS = ['Photoshop', 'Illustrator', 'Canva', 'Python', 'Social Media', 'Data Analysis', 'Bilingual'];
  const GRID_SIZE = 8;
  const SKILL_INDICES = [5, 12, 27, 34, 41, 52, 60]; // 1-based 位置，落在 8x8 矩陣裡

  const stage = document.getElementById('dotStage');
  const matrix = document.getElementById('dotMatrix');
  const hero = document.getElementById('hero');
  if (!stage || !matrix || !hero) return;

  const visited = new Set();
  const skillByIndex = new Map(SKILL_INDICES.map((index, i) => [index, SKILLS[i]]));
  const totalDots = GRID_SIZE * GRID_SIZE;

  for (let i = 1; i <= totalDots; i++) {
    const dot = document.createElement('span');
    dot.className = 'dot';

    const skill = skillByIndex.get(i);
    if (skill) {
      dot.classList.add('dot-skill');
      dot.dataset.skill = skill;

      const label = document.createElement('span');
      label.className = 'dot-label';
      label.textContent = skill;
      dot.appendChild(label);

      dot.addEventListener('mouseenter', () => {
        dot.classList.add('is-active');
        visited.add(skill);
        if (visited.size === SKILLS.length) {
          stage.classList.add('is-complete');
        }
      });
      dot.addEventListener('mouseleave', () => {
        dot.classList.remove('is-active');
      });
    }

    matrix.appendChild(dot);
  }

  hero.addEventListener('mouseleave', () => {
    stage.classList.remove('is-complete');
    visited.clear();
    matrix.querySelectorAll('.dot-skill.is-active').forEach((dot) => dot.classList.remove('is-active'));
  });
});
