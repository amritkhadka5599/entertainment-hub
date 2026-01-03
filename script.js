const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const suggestions = document.getElementById('suggestions');
const minRatingInput = document.getElementById('minRating');
const releaseYearInput = document.getElementById('releaseYear');
// ---------- Modal Elements ----------
const modal = document.getElementById('detailsModal');
const modalClose = document.querySelector('.close');
const detailsImg = document.getElementById('detailsImg');
const detailsTitle = document.getElementById('detailsTitle');
const detailsPlot = document.getElementById('detailsPlot');
const detailsRating = document.getElementById('detailsRating');
const detailsReleaseDate = document.getElementById('detailsReleaseDate');
const detailsCast = document.getElementById('detailsCast');
const detailsGenre = document.getElementById('detailsGenre');
const detailsRuntime = document.getElementById('detailsRuntime');
const trailerBtn = document.getElementById('trailerBtn');



let queryGlobal = "";
let pageTracker = { movies: 1, anime: 1, games: 1, music: 1 };

// Replace with your API keys
const OMDB_API = '6903eb01';
const TMDB_API = '70a369104081b6fd71ff826b4f20f9e6';
const RAWG_API = 'a8aab0b87a684ee1af8d2ac4104e46da';
const LASTFM_API = '3b32e2c0784dcaa1b354f3928a0c62ed';

// -----------------
// Tab switching
// -----------------
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    tabContents.forEach(c => c.classList.remove('active'));
    document.getElementById(target).classList.add('active');
  });
});

// -----------------
// Auto-complete suggestions (for movies & anime)
// -----------------
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();
  if (!query) return suggestions.style.display = 'none';
  
  fetch(`https://www.omdbapi.com/?s=${query}&apikey=${OMDB_API}`)
    .then(res => res.json())
    .then(data => {
      if (data.Search) {
        suggestions.innerHTML = '';
        data.Search.slice(0, 5).forEach(item => {
          const li = document.createElement('li');
          li.textContent = item.Title;
          li.addEventListener('click', () => {
            searchInput.value = item.Title;
            suggestions.style.display = 'none';
          });
          suggestions.appendChild(li);
        });
        suggestions.style.display = 'block';
      }
    });
});

// -----------------
// Search
// -----------------
searchBtn.addEventListener('click', () => {
  const query = searchInput.value.trim();
  if (!query) return alert("Type something!");
  queryGlobal = query;
  pageTracker = { movies: 1, anime: 1, games: 1, music: 1 };
  tabContents.forEach(tab => tab.innerHTML = '');
  searchMovies(query);
  searchAnime(query);
  searchGames(query);
  searchMusic(query);
});

// -----------------
// Filters
// -----------------
function passesFilters(item) {
  const minRating = parseFloat(minRatingInput.value) || 0;
  const yearFilter = parseInt(releaseYearInput.value) || 0;
  const rating = parseFloat(item.imdbRating || item.rating || 0);
  const year = parseInt(item.Released ? item.Released.slice(0,4) : 0);
  return rating >= minRating && (!yearFilter || year === yearFilter);
}

// -----------------
// Infinite Scroll
// -----------------
window.addEventListener('scroll', () => {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    if (activeTab === 'movies') searchMovies(queryGlobal, ++pageTracker.movies);
    if (activeTab === 'anime') searchAnime(queryGlobal, ++pageTracker.anime);
    if (activeTab === 'games') searchGames(queryGlobal, ++pageTracker.games);
    if (activeTab === 'music') searchMusic(queryGlobal, ++pageTracker.music);
  }
});

// -----------------
// Movies / Web Series
// -----------------
function searchMovies(query, page = 1) {
  fetch(`https://www.omdbapi.com/?s=${query}&page=${page}&apikey=${OMDB_API}`)
    .then(res => res.json())
    .then(data => {
      if (data.Search) {
        data.Search.forEach(item => {
          fetch(`https://www.omdbapi.com/?i=${item.imdbID}&apikey=${OMDB_API}`)
            .then(res => res.json())
            .then(details => {
              if (passesFilters(details)) document.getElementById('movies').innerHTML += createCard(details);
            });
        });
      }
    });
}

// -----------------
// Anime
// -----------------
function searchAnime(query, page = 1) {
  fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API}&query=${query}&page=${page}&language=en-US`)
    .then(res => res.json())
    .then(data => {
      if (data.results) {
        data.results.forEach(item => {
          const obj = {
            Title: item.name,
            Plot: item.overview,
            Poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
            Released: item.first_air_date,
            imdbRating: item.vote_average,
            Actors: 'N/A'
          };
          if (passesFilters(obj)) document.getElementById('anime').innerHTML += createCard(obj);
        });
      }
    });
}

// -----------------
// Games
// -----------------
function searchGames(query, page = 1) {
  fetch(`https://api.rawg.io/api/games?search=${query}&page=${page}&key=${RAWG_API}`)
    .then(res => res.json())
    .then(data => {
      if (data.results) {
        data.results.forEach(item => {
          const obj = {
            Title: item.name,
            Plot: item.description || 'No description available.',
            Poster: item.background_image || 'https://via.placeholder.com/300x450',
            Released: item.released,
            imdbRating: item.rating,
            Actors: 'N/A'
          };
          if (passesFilters(obj)) document.getElementById('games').innerHTML += createCard(obj);
        });
      }
    });
}

// -----------------
// Music
// -----------------
function searchMusic(query, page = 1) {
  fetch(`http://ws.audioscrobbler.com/2.0/?method=track.search&track=${query}&api_key=${LASTFM_API}&format=json&page=${page}`)
    .then(res => res.json())
    .then(data => {
      if (data.results.trackmatches.track) {
        data.results.trackmatches.track.forEach(item => {
          const obj = {
            Title: item.name,
            Plot: 'Artist: ' + item.artist,
            Poster: 'https://via.placeholder.com/300x300',
            Released: 'N/A',
            imdbRating: 'N/A',
            Actors: item.artist
          };
          if (passesFilters(obj)) document.getElementById('music').innerHTML += createCard(obj);
        });
      }
    });
}

// -----------------
// Card HTML
// -----------------

function createCard(item) {
  return `
    <div class="card" 
         data-title="${item.Title}" 
         data-plot="${item.Plot || "No description available."}" 
         data-poster="${item.Poster !== "N/A" ? item.Poster : 'https://via.placeholder.com/300x450'}" 
         data-rating="${item.imdbRating || item.rating || "N/A"}" 
         data-released="${item.Released || "Unknown"}" 
         data-cast="${item.Actors || "N/A"}"
         data-genre="${item.Genre || 'N/A'}"
         data-runtime="${item.Runtime || 'N/A'}">
      <img src="${item.Poster !== "N/A" ? item.Poster : 'https://via.placeholder.com/300x450'}" alt="${item.Title}">
      <div class="card-rating">${item.imdbRating || item.rating || "N/A"}</div>
      <div class="card-info">
        <div class="card-title">${item.Title}</div>
        <div class="card-sub"><strong>Release:</strong> ${item.Released || "Unknown"}</div>
        <div class="card-sub"><strong>Cast:</strong> ${item.Actors || "N/A"}</div>
      </div>
    </div>
  `;
}
// ---------- Open Modal on Card Click ----------
document.body.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;

  detailsImg.src = card.dataset.poster;
  detailsTitle.textContent = card.dataset.title;
  detailsPlot.textContent = card.dataset.plot;
  detailsRating.textContent = card.dataset.rating;
  detailsReleaseDate.textContent = card.dataset.released;
  detailsCast.textContent = card.dataset.cast;
  detailsGenre.textContent = card.dataset.genre;
  detailsRuntime.textContent = card.dataset.runtime;

  // Trailer button opens YouTube search
  trailerBtn.onclick = () => {
    const query = encodeURIComponent(card.dataset.title + " trailer");
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  };

  modal.style.display = 'flex';
});

// ---------- Close Modal ----------
modalClose.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

