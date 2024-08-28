import html2canvas from "html2canvas";
import gameData from "./data";
import preloadImage from "./helpers";

const mainEl = document.getElementById('pageContent');
const pageContainerEl = document.getElementById('pageContainer');
const canvasContainerEl = document.getElementById('canvasContainer');
const navItems = document.querySelectorAll('nav > ul > li');
const navEl = document.querySelector('nav');
const infoText = document.getElementById('infoText');
const coverImgEl = document.getElementById('coverImg');
const animateDuration = 1000;

class CanvasInfo {
  constructor(colsDeleted, columns) {
    this.colsDeleted = colsDeleted;
    this.columns = columns;
  }

  getColumnsLength() {
    return this.columns.length;
  }

  getColumnAt(index) {
    return this.columns[index];
  }

  getColsDeleted() {
    return this.colsDeleted;
  }

  addColumn(newCol) {
    this.columns.push(newCol);
  }

  setColumns(cols) {
    this.columns = cols;
  }

  deleteColumn() {
    this.colsDeleted++;
  }
}

// Columns leave trails at bottom... make them move further at higher res
const bonusOffset = screen.availHeight <= 1080 ? 50 : (screen.availHeight > 1080 && screen.availHeight <= 1440) ? 200 : 500;

function animateColumn(i, ctx, endY, duration, canvasInfo) {
  const columnCount = canvasInfo.getColumnsLength();
  const columnAtI = canvasInfo.getColumnAt(i);
  const { imageData, position: { x: startX, y: startY, width: colWidth, height: colHeight } } = columnAtI;
  const endX = startX;

  let startTime = null;
  
  function draw(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Calculate the current position based on elapsed time
      const progress = Math.min(elapsed / duration, 1); // Ensure progress doesn't exceed 1
      const currentX = startX + (endX - startX) * progress;
      const currentY = startY + (endY - startY) * progress;

      // Clear the canvas and draw the rectangle at the new position
      ctx.clearRect(startX, startY, colWidth, colHeight + navEl.offsetHeight + bonusOffset); // + offsetHeight since it seems to stop short of nav height

      // Draw the column at new position
      ctx.putImageData(imageData, currentX, currentY);

      // Continue animating until the duration is reached
      if (progress < 1) {
          requestAnimationFrame(draw);
      } else {
        canvasInfo.deleteColumn();
        if (canvasInfo.getColsDeleted() >= columnCount) {
          canvasContainerEl.removeChild(canvasContainerEl.lastChild);
        } // Remove the canvas when last column is at the bottom
      }
  }

  requestAnimationFrame(draw);
}

function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

const manipulateCanvas = (canvas, newCanvasInfo) => {
  console.log('Manipulate started', canvas);
  const ctx = canvas.getContext('2d');
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;
  // How wide should each column be
  const columnTargetWidth = canvasWidth / 180; // 160 slices in the OG doom
  // const columns = [];

  for(let x = 0; x < canvasWidth; x += columnTargetWidth) {
    newCanvasInfo.addColumn({ 
      position: { x, y: 0, width: columnTargetWidth, height: canvasHeight },
      imageData: ctx.getImageData(x, 0, columnTargetWidth + 2, canvasHeight) }); // +2 for the colWidth to eliminate tiny gaps
  }

  // console.log('cols', newCanvasInfo.columns);

  // Mimic Doom's random delay feature, get a first initial delay value, then increase, decrease or stay the same for each column
  const possibleDelays = Array.from({ length: 10 }, (current, i) => i * 50); // Delays are at 100ms intervals
  let baseDelayIndex = getRandomInt(0, possibleDelays.length);

  for (let i = 0; i < newCanvasInfo.getColumnsLength(); i++) {
    // Generate a random delay between 0 and 1000 ms
    setTimeout(() => {
      animateColumn(
        i,
        ctx,
        canvasHeight + navEl.offsetHeight + bonusOffset,
        animateDuration,
        newCanvasInfo,
      );
    }, possibleDelays[baseDelayIndex]);
    baseDelayIndex = getNextIndex(baseDelayIndex, possibleDelays);
  }
}

const getNextIndex = (currentIndex, possibleValues) => {
  if (currentIndex === 0) {
    // Either increase or stay the same
    return Math.random() > 0.5 ? currentIndex += 1 : currentIndex;
  }
  if (currentIndex === possibleValues.length - 1) {
    // Either decrease or stay the same
    return Math.random() > 0.5 ? currentIndex -= 1 : currentIndex;
  }
  const randomVal = Math.random();
  // Either increase, decrease or stay the same:
  if (randomVal >= 0 && randomVal <= 0.33) {
    return currentIndex -= 1;
  } else  if (randomVal >= 0.33 && randomVal <= 0.66) {
    return currentIndex;
  }
  return currentIndex += 1;
}

const startMelt = (pageSelected) => {
  const mainWidth = mainEl.offsetWidth;
  const mainHeight = mainEl.offsetHeight;
  // console.log('container', canvasContainerEl);
  const newCanvasInfo = new CanvasInfo(0, []);
  html2canvas(pageContainerEl, { width: mainWidth, height: mainHeight, scale: 1 }).then(function(canvas) {
    canvasContainerEl.insertBefore(canvas, canvasContainerEl.firstChild);
    loadMainContent(pageSelected).then((res) => {
      manipulateCanvas(canvas, newCanvasInfo);
    });
  });
};

const loadMainContent = async (id) => {
  await preloadImage(gameData[id].backgroundImage, () => {
    pageContainerEl.style.backgroundImage = `url(${gameData[id].backgroundImage})`;
  })
  await preloadImage(gameData[id].cover, () => {
    coverImgEl.setAttribute('src', gameData[id].cover);
  })
  infoText.innerText = gameData[id].description;
}

const handleNavClick = (ev) => {
  // if (isMelting) return;
  const pageSelected = ev.target.dataset.game;
  for (let i = 0; i < navItems.length; i++) {
    navItems[i].classList.remove('activeNav');
  }
  navItems[pageSelected - 1].classList.add('activeNav');
  startMelt(pageSelected);
}

document.addEventListener('DOMContentLoaded', (event) => {
  // buttonEl.addEventListener('click', handleClick);
  for(let i = 0; i < navItems.length; i++) {
    navItems[i].addEventListener('click', handleNavClick);
  }
});

loadMainContent(1);
