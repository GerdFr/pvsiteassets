/**
 * Psycho-Vision Wissen Course Widget
 * Dynamisches Kurs-Widget für psycho-vision.de /wissen/ Seiten
 *
 * Funktionalität:
 * - Automatische Anzeige von Kursen basierend auf der aktuellen Störungsseite
 * - Kurse werden aus einer Mapping-Tabelle geladen
 * - Suchfunktion für Hub-Seiten
 * - Fallback-Messaging wenn keine Kurse verfügbar sind
 */

(function() {
  'use strict';

  /**
   * Vollständige Zuordnung von Störungsseiten zu Kursen
   * Format: 'slug-der-seite': ['kurs-slug-1', 'kurs-slug-2', ...]
   */
  var WISSEN_COURSE_MAP = {
    'angststorungen': ['angststorungen', 'exposition-generalisierte-angst', 'exposition-panik', 'exposition-spezifische-phobien', 'beschleunigte-behandlung-angst-panik-phobien'],
    'generalisierte-angststorung': ['exposition-generalisierte-angst', 'angststorungen'],
    'panikstorung': ['exposition-panik', 'beschleunigte-behandlung-angst-panik-phobien', 'angststorungen'],
    'spezifische-phobien': ['exposition-spezifische-phobien', 'angststorungen'],
    'soziale-phobie': ['soziale-phobien', 'sozphob-kompendium', 'ein-strategischer-ansatz-zur-behandlung-sozialer-angststrungen'],
    'depression': ['depressionen'],
    'bipolare-storung': ['bipolare-storungen-1', 'bipolare-storungen-2', 'bipolar-kompendium'],
    'borderline-persoenlichkeitsstorung': ['schema-borderline-storung'],
    'persoenlichkeitsstoerungen': ['einfuhrung-personlichkeitsstorungen', '3-ansaetze-zu-persoenlichkeitsstorungen', 'das-konzept-persoenlichkeitsstorung-klaerungsorientierte-sicht', 'diagnostik-persoenlichkeitsstorung'],
    'narzisstische-persoenlichkeitsstorung': ['narzisstische-personlichkeitsstorung', '2026-11-21-narzisstische-ps-webinar'],
    'dependente-persoenlichkeitsstorung': ['dependente-personlichkeitsstorung'],
    'histrionische-persoenlichkeitsstorung': ['histrionische-personlichkeitsstorung'],
    'paranoide-persoenlichkeitsstorung': ['paranoide-personlichkeitsstorung'],
    'passiv-aggressive-persoenlichkeitsstorung': ['passiv-aggressive-personlichkeitsstorung'],
    'schizoide-persoenlichkeitsstorung': ['schizoide-personlichkeitsstorung'],
    'selbstunsichere-persoenlichkeitsstorung': ['selbstunsichere-personlichkeitsstorung'],
    'zwanghafte-persoenlichkeitsstorung': ['zwanghafte-personlichkeitsstorung'],
    'zwangsstoerung': ['zwangsstorungen-1', 'zwangsstorungen-2', 'fortgeschrittene-kognitive-verhaltensinterventionen-zwangsstorungen', 'olfaktorische-referenzstoerung'],
    'essstoerungen': ['essstorungen-1', 'essstorungen-2', 'essstoerungen-therapie-kompendium'],
    'adhs': ['adhs-hyperkinetische-stoerungen', 'umfassendes-adhs-therapie-paket'],
    'ptbs': ['posttraumatische-belastungsstorungen-ptbs', 'narrative-expositionstherapie-net', 'heilung-von-inzest-und-komplexen-kindheitstraumata', 'mikrotrauma', 'zeitperspektiventherapie'],
    'schlafsstoerungen': ['schlafstorungen'],
    'schmerzsstoerungen': ['schmerzstorungen', 'chronische-schmerzen-kommunikation-bps-modell'],
    'somatoforme-stoerungen': ['somatoforme-storungen-hypochondrie'],
    'suchterkrankungen': ['psychotherapie-verhaltenssuchte', 'social-media-abhangigkeit'],
    'burnout': ['burnout', 'arbeitswelt-psychotherapie'],
    'trauer': ['therapie-bei-trauer', 'meisterkurs-trauertherapie'],
    'psychosen': [],
    'prokrastination': ['erfolgreich-erledigt-statt-aufgeschoben-seminar-prokrastination'],
    'psychosomatik': ['2026-03-21-psychosomatik-1-webinar', '2026-06-13-psychosomatik-2-webinar', 'alles-psychisch-oder-was-online-seminar'],
    'anpassungsstoerungen': ['anpassungsstorungen'],
    'psychoonkologie': ['krebs-psychoonkologie', 'einblick-psychoonkologische-arbeit'],
    'peripartale-stoerungen': ['psychische-erkrankungen-rund-um-die-geburt-und-danach', 'menopause-in-der-psychotherapie'],
    'long-covid': ['long-post-covid-webinar'],
    'geschlechtsidentitaet': ['transsexualitat'],
    'psychopathie': ['2026-10-24-psychopathie-webinar'],
    'suizidalitaet': ['psychotherapie-suizidale-patienten', 'bewertung-intervention-suizidale-patienten', 'dbt-suizidale-patienten-marsha-linehan']
  };

  /**
   * Formatiert einen Kurs-Slug in einen lesbaren Titel
   * - Ersetzt Bindestriche durch Leerzeichen
   * - Großbuchstaben am Anfang jedes Wortes
   * - Entfernt Datums-Präfixe (z.B. "2026-03-21-")
   *
   * @param {string} slug - Der Kurs-Slug
   * @returns {string} - Der formatierte Titel
   */
  function formatCourseTitle(slug) {
    // Entfernt Datums-Präfixe (YYYY-MM-DD-)
    var cleanSlug = slug.replace(/^\d{4}-\d{2}-\d{2}-/, '');

    // Ersetzt Bindestriche durch Leerzeichen
    var title = cleanSlug.replace(/-/g, ' ');

    // Großbuchstaben am Anfang jedes Wortes
    title = title.replace(/\b\w/g, function(char) {
      return char.toUpperCase();
    });

    return title;
  }

  /**
   * Erstellt ein HTML-String für eine Kurskarte
   *
   * @param {string} courseSlug - Der Slug des Kurses
   * @returns {string} - Das HTML für die Kurskarte
   */
  function createCourseCardHTML(courseSlug) {
    var courseTitle = formatCourseTitle(courseSlug);
    var courseUrl = 'https://psycho-vision.de/course/' + courseSlug;

    // Generiert eine Farbverlauf basierend auf dem Slug (für visuellen Unterschied)
    var gradientColor1 = '#' + (Math.abs(courseSlug.charCodeAt(0) * 12345) % 16777215).toString(16).padStart(6, '0');
    var gradientColor2 = '#' + (Math.abs(courseSlug.charCodeAt(courseSlug.length - 1) * 54321) % 16777215).toString(16).padStart(6, '0');

    var html = '<div class="wissen-course-card">' +
      '<div class="wissen-course-image" style="background: linear-gradient(135deg, ' + gradientColor1 + ' 0%, ' + gradientColor2 + ' 100%);"></div>' +
      '<div class="wissen-course-content">' +
      '<h3 class="wissen-course-title">' + courseTitle + '</h3>' +
      '<a href="' + courseUrl + '" class="wissen-course-button" target="_blank" rel="noopener noreferrer">Kurs ansehen</a>' +
      '</div>' +
      '</div>';

    return html;
  }

  /**
   * Extrahiert den aktuellen Seiten-Slug aus der URL
   * Erwartet Format: /wissen/[slug]/ oder /wissen/[slug]
   *
   * @returns {string} - Der Seiten-Slug (oder leerer String wenn nicht gefunden)
   */
  function getCurrentPageSlug() {
    var pathname = window.location.pathname;
    var wissenIndex = pathname.indexOf('/wissen/');

    if (wissenIndex === -1) {
      return '';
    }

    // Extrahiert den Teil nach /wissen/
    var remaining = pathname.substring(wissenIndex + 8); // 8 = '/wissen/'.length

    // Entfernt trailing slash
    remaining = remaining.replace(/\/$/, '');

    // Wenn leer (ist /wissen/ Hub-Seite), gibt leeren String zurück
    if (!remaining) {
      return '';
    }

    return remaining;
  }

  /**
   * Initialisiert das Kurs-Widget für eine einzelne Störungsseite
   * Sucht nach Container mit ID und füllt ihn mit Kurskarten
   *
   * @param {string} containerId - Die ID des Container-Elements
   */
  function initWissenCourseWidget(containerId) {
    var container = document.getElementById(containerId);

    if (!container) {
      console.warn('Wissen Course Widget: Container mit ID "' + containerId + '" nicht gefunden.');
      return;
    }

    var currentSlug = getCurrentPageSlug();

    if (!currentSlug) {
      console.warn('Wissen Course Widget: Konnte Seiten-Slug nicht aus URL extrahieren.');
      return;
    }

    var courseSlugs = WISSEN_COURSE_MAP[currentSlug];

    if (!courseSlugs) {
      console.info('Wissen Course Widget: Keine Kurse für Seite "' + currentSlug + '" definiert.');
      showFallbackMessage(container);
      return;
    }

    if (courseSlugs.length === 0) {
      console.info('Wissen Course Widget: Kursliste für "' + currentSlug + '" ist leer.');
      showFallbackMessage(container);
      return;
    }

    // Erstellt das Grid-Container-Element
    var grid = document.createElement('div');
    grid.className = 'wissen-course-grid';

    // Fügt Kurskarten zum Grid hinzu
    for (var i = 0; i < courseSlugs.length; i++) {
      var courseSlug = courseSlugs[i];
      var cardHTML = createCourseCardHTML(courseSlug);

      var cardWrapper = document.createElement('div');
      cardWrapper.innerHTML = cardHTML;
      grid.appendChild(cardWrapper.firstChild);
    }

    // Löscht vorhandenen Inhalt und fügt Grid hinzu
    container.innerHTML = '';
    container.appendChild(grid);
  }

  /**
   * Zeigt eine Fallback-Nachricht, wenn keine Kurse verfügbar sind
   *
   * @param {HTMLElement} container - Das Container-Element
   */
  function showFallbackMessage(container) {
    var fallbackHTML = '<div class="wissen-course-fallback">' +
      '<p>Für diese Seite sind derzeit keine Kurse verfügbar.</p>' +
      '<a href="/wissen/" class="wissen-fallback-link">Zu allen Kursangeboten</a>' +
      '</div>';

    container.innerHTML = fallbackHTML;
  }

  /**
   * Initialisiert die Suchfunktion für die Hub-Seite
   * Filtert .wissen-hub-card Elemente basierend auf Sucheingabe
   *
   * @returns {void}
   */
  function initWissenSearch() {
    var searchInput = document.getElementById('wissen-search-input');

    if (!searchInput) {
      console.warn('Wissen Search: Suchfeld mit ID "wissen-search-input" nicht gefunden.');
      return;
    }

    // Findet alle Hub-Karten
    var cards = document.querySelectorAll('.wissen-hub-card');

    if (cards.length === 0) {
      console.warn('Wissen Search: Keine Hub-Karten (.wissen-hub-card) auf der Seite gefunden.');
      return;
    }

    // Event-Listener für Suchangabe
    searchInput.addEventListener('keyup', function() {
      filterCards(searchInput.value, cards);
    });

    // Auch auf Input-Event für bessere Responsivität
    searchInput.addEventListener('input', function() {
      filterCards(searchInput.value, cards);
    });
  }

  /**
   * Filtert Hub-Karten basierend auf Suchtext
   * Zeigt/versteckt Karten und deren Parent-Sektionen
   *
   * @param {string} searchTerm - Der Suchbegriff
   * @param {NodeList} cards - Liste der Karten-Elemente
   */
  function filterCards(searchTerm, cards) {
    var lowerSearchTerm = searchTerm.toLowerCase().trim();
    var visibleSections = {};

    cards.forEach(function(card) {
      var cardText = card.textContent.toLowerCase();
      var shouldShow = lowerSearchTerm === '' || cardText.indexOf(lowerSearchTerm) !== -1;

      // Zeigt oder versteckt die Karte
      card.style.display = shouldShow ? '' : 'none';

      // Verfolgt sichtbare Sektionen
      if (shouldShow) {
        var section = card.closest('section') || card.closest('.wissen-section');
        if (section) {
          visibleSections[section] = true;
        }
      }
    });

    // Zeigt/versteckt Sektionen basierend auf sichtbaren Karten
    var sections = document.querySelectorAll('section, .wissen-section');
    sections.forEach(function(section) {
      var hasVisibleCards = false;
      var sectionCards = section.querySelectorAll('.wissen-hub-card');

      sectionCards.forEach(function(card) {
        if (card.style.display !== 'none') {
          hasVisibleCards = true;
        }
      });

      section.style.display = hasVisibleCards ? '' : 'none';
    });
  }

  /**
   * Auto-Initialisierung bei DOMContentLoaded
   * Sucht nach relevanten Containern und initialisiert das Widget
   */
  function autoInit() {
    // Versucht, das Kurs-Widget zu initialisieren (auf Störungsseiten)
    var courseContainer = document.getElementById('wissen-courses-container');
    if (courseContainer) {
      initWissenCourseWidget('wissen-courses-container');
    }

    // Versucht, die Suchfunktion zu initialisieren (auf Hub-Seite)
    var searchInput = document.getElementById('wissen-search-input');
    if (searchInput) {
      initWissenSearch();
    }
  }

  /**
   * Registriert Auto-Initialisierung
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    // DOM ist bereits geladen
    autoInit();
  }

  /**
   * Exportiert öffentliche API für externe Zugriffe
   * Machen Sie die Funktionen global verfügbar (falls benötigt)
   */
  window.WissenCourseWidget = {
    init: initWissenCourseWidget,
    initSearch: initWissenSearch,
    formatTitle: formatCourseTitle,
    getCurrentSlug: getCurrentPageSlug,
    getCourseMap: function() {
      return WISSEN_COURSE_MAP;
    }
  };

})();
