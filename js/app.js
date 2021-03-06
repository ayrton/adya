App = Ember.Application.create();

App.Router.map(function() {
  this.resource("discography");
  this.resource("downloads", function() {
    this.route("videos");
    this.route("photos");
  });
});

App.ApplicationRoute = Ember.Route.extend({
  events: {
    showModal: function(modal) {
      this.render(modal, { into: "application", outlet: "modal" });
    },

    closeModal: function() {
      this.render("empty", { into: "application", outlet: "modal" });
    }
  }
});

App.IndexRoute = Ember.Route.extend({
  setupController: function(controller, model) {
    this._super(controller, model);
    this.setupHeroController();
    this.setupToursController();
    this.setupTopSinglesController();
    this.setupPhotoAlbumController();
  },

  setupHeroController: function() {
    var classic_four = App.Album.find(6);
    this.controllerFor("hero").set("model", classic_four);
  },

  setupToursController: function() {
    this.controllerFor("tours").set("model", App.Tour.find());
  },

  setupTopSinglesController: function() {
    var albums = Ember.A([
      App.Album.find(6),
      App.Album.find(5),
      App.Album.find(2),
      App.Album.find(1)
    ]);

    this.controllerFor("topSingles").set("model", albums);
  },

  setupPhotoAlbumController: function() {
    this.controllerFor("photoAlbum").set("model", App.Photo.find());
  }
});

App.DiscographyRoute = Ember.Route.extend({
  model: function() {
    return App.Album.find();
  }
});

App.DownloadsIndexRoute = Ember.Route.extend({
  redirect: function() {
    this.transitionTo("downloads.videos");
  }
});

App.DownloadsVideosRoute = Ember.Route.extend({
  model: function() {
    return App.Video.find();
  }
});

App.PopupView = Ember.View.extend({
  tagName: "a",
  attributeBindings: ["href"],
  templateName: "popup",

  didInsertElement: function() {
    this.$().magnificPopup({ type: this.get("popupType") });
  }
});

App.DownloadsPhotosRoute = Ember.Route.extend({
  model: function() {
    return App.Photo.find();
  }
});

App.ApplicationController = Ember.Controller.extend({
  willClearModal: function() {
    this.send("closeModal");
  }.observes("currentPath"),

  showContact: function() {
    this.send("showModal", "contact");
  }
});

App.HeroController = Ember.ObjectController.extend();

App.ToursController = Ember.ArrayController.extend();

App.TopSinglesController = Ember.ArrayController.extend({});

App.TopSinglesAlbumController = Ember.ObjectController.extend({
  topTracks: function() {
    return this.get("model.tracks").filterProperty("bestseller", true);
  }.property("model.tracks.@each.bestseller")
});

App.PhotoAlbumController = Ember.ArrayController.extend({
  // FixtureAdapter does not support querying ;(
  filteredModel: function() {
    return this.get("model").filter(function(photo) {
      return !photo.get("album");
    });
  }.property("model.@each.album")
});

App.DiscographyController = Ember.ArrayController.extend({
  sortedAlbums: function() {
    return Ember.ArrayProxy.createWithMixins(Ember.SortableMixin, {
      sortProperties: ["id"],
      content: this.get("content")
    });
  }.property("content")
});

App.AlbumController = Ember.ObjectController.extend({
  trackLists: function() {
    var tracks = this.get("model.tracks");
    var modulo = tracks.get("length") % 3;
    var divider = (tracks.get("length") - modulo) / 3 + 1;

    return [
      tracks.slice(0, divider),
      tracks.slice(divider, divider * 2),
      tracks.slice(divider * 2, divider * 3)
    ];
  }.property("model.tracks")
});

App.DownloadsPhotosController = Ember.ArrayController.extend({
  // FixtureAdapter does not support querying ;(
  filteredModel: function() {
    return this.get("model").filter(function(photo) {
      return !!photo.get("album");
    });
  }.property("model.@each.album")
});

App.ContactController = Ember.ObjectController.extend({
  mandrillError: false,

  content: function() {
    return App.Message.create();
  }.property(),

  sendMessage: function() {
    var jqxhr = this.get("model").send();
    var self = this;

    jqxhr.error(function() {
      self.set("mandrillError", true);
    });

    jqxhr.success(function() {
      self.set("content", App.Message.create());
      self.send("closeModal");
    });
  }
});

App.ContactView = Ember.View.extend({
  click: function(e) {
    if ($(e.target).parents("#modal").length === 0) {
      this.get("controller").send("closeModal");
    }
  },

  didInsertElement: function() {
    var self = this;

    $(document).on("keyup", function(e) {
      Ember.run(this, function() {
        var escapeKeyCode = 27;

        if (e.keyCode === escapeKeyCode) {
          self.get("controller").send("closeModal");
        }
      });
    });
  },

  willClearRender: function() {
    $(document).off("keyup");
  }
});

Ember.Handlebars.registerBoundHelper("month", function(value) {
  return moment(value).format("MMM");
});

Ember.Handlebars.registerBoundHelper("day", function(value) {
  return moment(value).format("DD");
});

Ember.Handlebars.registerBoundHelper("time", function(value) {
  var value = moment(value).format("HH:mm");

  if (value === "00:00") {
    return "--";
  } else {
    return value;
  }
});

App.Store = DS.Store.extend({
  adapter: DS.FixtureAdapter.create({ latency: 0 })
});

App.Album = DS.Model.extend({
  title: DS.attr("string"),
  tracks: DS.hasMany("App.Track"),
  amazon: DS.attr("string"),
  itunes: DS.attr("string"),

  coverImage: function() {
    if (this.get("title")) {
      return "images/album-" + this.get("title").dasherize() + ".png";
    }
  }.property("title")
});

App.Track = DS.Model.extend({
  title: DS.attr("string"),
  composer: DS.attr("string"),
  bestseller: DS.attr("boolean"),
  itunes: DS.attr("itunes")
});

App.Tour = DS.Model.extend({
  date: DS.attr("string"),
  city: DS.attr("string"),
  location: DS.attr("string"),
  tickets: DS.attr("string")
});

App.Video = DS.Model.extend({
  title: DS.attr("string"),
  src: DS.attr("string"),
  thumbnail: DS.attr("string"),
  album: DS.belongsTo("App.Album")
});

App.Photo = DS.Model.extend({
  src: DS.attr("string"),
  thumbnail: DS.attr("string"),
  album: DS.belongsTo("App.Album")
});

App.Message = Ember.Object.extend({
  apiKey: function() {
    return "fad8482c-0c4b-400d-97dc-6e6da2dfae00";
  }.property(),

  formattedSubject: function() {
    return (
      "[ADYA.EU] " +
      (this.get("subject") ? this.get("subject") : "Music Inquiry")
    );
  }.property("subject"),

  formattedBody: function() {
    return this.get("body") + "\n\n--\nSent from http://adya.eu";
  }.property("body"),

  options: function() {
    return {
      key: this.get("apiKey"),
      message: {
        subject: this.get("formattedSubject"),
        text: this.get("formattedBody"),
        from_email: this.get("email"),
        from_name: this.get("name"),
        to: [
          {
            email: "mousemusic@yucom.be",
            name: "Mouse Music"
          }
        ],
        headers: {
          "Reply-To": this.get("email")
        },
        important: true
      }
    };
  }.property("apiKey", "formattedSubject", "formattedBody", "email", "name"),

  send: function() {
    var jqxhr = $.post(
      "https://mandrillapp.com/api/1.0//messages/send.json",
      this.get("options")
    );
    return jqxhr;
  }
});

App.Album.FIXTURES = [
  {
    id: 1,
    title: "Classic 1",
    tracks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
  },
  {
    id: 2,
    title: "Classic 2",
    tracks: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37]
  },
  {
    id: 3,
    title: "Classic Special",
    tracks: [
      41,
      42,
      43,
      44,
      45,
      46,
      47,
      48,
      49,
      50,
      51,
      52,
      53,
      54,
      55,
      56,
      57,
      58,
      59,
      60,
      61
    ]
  },
  {
    id: 4,
    title: "Best Classic",
    tracks: [
      71,
      72,
      73,
      74,
      75,
      76,
      77,
      78,
      79,
      80,
      81,
      82,
      83,
      84,
      85,
      86,
      87,
      88,
      89,
      90,
      91
    ]
  },
  {
    id: 5,
    title: "Classic 3",
    tracks: [
      101,
      102,
      103,
      104,
      105,
      106,
      107,
      108,
      109,
      110,
      111,
      112,
      113,
      114,
      115,
      116,
      117
    ],
    amazon: "http://www.amazon.de/Classic-3-Opera-Adya/dp/B00D4D5PC8",
    itunes: "https://itunes.apple.com/be/album/adya-classic-3/id653472088"
  },
  {
    id: 6,
    title: "Classic 4",
    tracks: [
      121,
      122,
      123,
      124,
      125,
      126,
      127,
      128,
      129,
      130,
      131,
      132,
      133,
      134,
      135,
      136,
      137,
      138,
      139,
      140,
      141,
      142,
      143,
      144,
      145,
      146,
      147,
      148,
      149,
      150
    ],
    amazon: "https://www.amazon.de/Adya-Classic-4/dp/B0753S9W3N/",
    itunes: "https://itunes.apple.com/be/album/classic-4/id1272721675"
  }
];

App.Track.FIXTURES = [
  {
    id: 1,
    title: "Light Cavalry Achrimides",
    composer: "F. Von Suppé",
    bestseller: true,
    itunes:
      "https://itunes.apple.com/be/album/light-cavalry-achrimides/id295865203?i=295865264"
  },
  {
    id: 2,
    title: "Tritsch Tratsch Phaeromidos",
    composer: "J. Strauss-Son"
  },
  {
    id: 3,
    title: "La Gazza Ladra Voladiche",
    composer: "G. Rossini",
    bestseller: true,
    itunes:
      "https://itunes.apple.com/be/album/la-gazza-ladra-voladiche/id295865203?i=295865442"
  },
  {
    id: 4,
    title: "Menuet Tsjardjeb",
    composer: "L. Boccherini"
  },
  {
    id: 5,
    title: "Serenade For Strings Paramankos",
    composer: "P.I. Tchaikovsky"
  },
  {
    id: 6,
    title: "Out Of Africa Carafulia",
    composer: "W.A. Mozart",
    bestseller: true,
    itunes:
      "https://itunes.apple.com/be/album/out-of-africa-carafulia/id295865203?i=295865448"
  },
  {
    id: 7,
    title: "Symphony N° 40 Xophoratis",
    composer: "W.A. Mozart"
  },
  {
    id: 8,
    title: "La Primavera Soliveyra",
    composer: "A. Vivaldi"
  },
  {
    id: 9,
    title: "Romanza Zeyvolo",
    composer: "W.A. Mozart"
  },
  {
    id: 10,
    title: "Ode to Joy Imar It Heri",
    composer: "L. von Beethoven"
  },
  {
    id: 11,
    title: "Eine Kleine Nachtmusik Djagobe",
    composer: "W.A. Mozart"
  },
  {
    id: 12,
    title: "Elvira Madigan Djazome",
    composer: "W.A. Mozart"
  },
  {
    id: 13,
    title: "The Marriage of Figaro Feztawi",
    composer: "W.A. Mozart"
  },
  {
    id: 14,
    title: "Habanera Frachotexar",
    composer: "G. Bizet"
  },
  {
    id: 15,
    title: "Walz of the Flowers Quosibatu",
    composer: "P.I. Tchaikovsky"
  },
  {
    id: 16,
    title: "Ruslan and Ludmilla Fabileju",
    composer: "M.I. Glinka"
  },
  {
    id: 17,
    title: "Il Trovatore Quodis Es Vitar",
    composer: "G. Verdi"
  },
  {
    id: 21,
    title: "Toreador Atjenki",
    composer: "G. Bizet"
  },
  {
    id: 22,
    title: "Alla Turca Ahriahne",
    composer: "W.A. Mozart"
  },
  {
    id: 23,
    title: "Morning Mood Trevobima",
    composer: "E.H. Grieg"
  },
  {
    id: 24,
    title: "Orpheus In The Underworld Nagodus",
    composer: "J. Offenbach"
  },
  {
    id: 25,
    title: "Amazing Grace Siralynth",
    composer: "E. Abrath",
    bestseller: true,
    itunes:
      "https://itunes.apple.com/be/album/amazing-grace/334633557?i=334633583"
  },
  {
    id: 26,
    title: "Hungarian Dance Netonkla",
    composer: "J. Brahms"
  },
  {
    id: 27,
    title: "Barcarolle Ourybova",
    composer: "J. Offenbach"
  },
  {
    id: 28,
    title: "The Emperor Muvagora",
    composer: "J. Strauss - Son",
    bestseller: true,
    itunes:
      "https://itunes.apple.com/be/album/the-emperor/334633557?i=334633620"
  },
  {
    id: 29,
    title: "Dance Of The Hours Souraktoff",
    composer: "A. Ponchielli",
    bestseller: true,
    itunes:
      "https://itunes.apple.com/be/album/dance-of-the-hours/334633557?i=334633624"
  },
  {
    id: 30,
    title: "Air Dorilun",
    composer: "J.S. Bach"
  },
  {
    id: 31,
    title: "Aïda Solaekride",
    composer: "G. Verdi"
  },
  {
    id: 32,
    title: "Capriccio Italien Fagrozzi",
    composer: "P.I. Tchaikovsky"
  },
  {
    id: 33,
    title: "Going Home Midecras",
    composer: "A.L. Dvorak"
  },
  {
    id: 34,
    title: "Serenade Lakisong",
    composer: "J. Haydn"
  },
  {
    id: 35,
    title: "Swan Lake Ositares",
    composer: "P.I. Tchaikovsky"
  },
  {
    id: 36,
    title: "Harp Concerto Endasori",
    composer: "G.F. Händel"
  },
  {
    id: 37,
    title: "Italian Symphony Krilasko",
    composer: "F. Mendelssohn, Bartholdy"
  },
  {
    id: 41,
    title: "Alhambra",
    composer: "F. Tarrega Eixea - P. Sterman - E. Abrath"
  },
  {
    id: 42,
    title: "Homecoming From A Foreign Country Denvobe",
    composer: "F. Mendelssohn - Bartholdy"
  },
  {
    id: 43,
    title: "Rhapsody Revangos",
    composer: "S.V. Rachmaninoff"
  },
  {
    id: 44,
    title: "Wings Of Summer",
    composer: "P. Sterman - E. Abrath"
  },
  {
    id: 45,
    title: "Rosamunde Celmanur",
    composer: "F. Schubert"
  },
  {
    id: 46,
    title: "Jeux Interdits",
    composer: "P. Sterman - E. Abrath"
  },
  {
    id: 47,
    title: "Pleasure Train Rosifora",
    composer: "J. Strauss - Son"
  },
  {
    id: 48,
    title: "Light Cavalry Achrimides",
    composer: "F. Von Suppé"
  },
  {
    id: 49,
    title: "Toreador Atjenki",
    composer: "G. Bizet"
  },
  {
    id: 50,
    title: "Orpheus In The Underworld Nagodus",
    composer: "J. Offenbach"
  },
  {
    id: 51,
    title: "Out Of Africa Carafulia",
    composer: "W.A. Mozart"
  },
  {
    id: 52,
    title: "Alla Turca Ahriahne",
    composer: "W.A. Mozart "
  },
  {
    id: 53,
    title: "Tritsch Tratsch Phaeromidos",
    composer: "J. Strauss - Son"
  },
  {
    id: 54,
    title: "Symphony N° 40 Xophoratis",
    composer: "W.A. Mozart"
  },
  {
    id: 55,
    title: "Hungarian Dance N° 5 Netonkla",
    composer: "J. Brahms"
  },
  {
    id: 56,
    title: "La Gazza Ladra Voladiche",
    composer: "G. Rossini"
  },
  {
    id: 57,
    title: "The Emperor Muvagora",
    composer: "J. Strauss - Son"
  },
  {
    id: 58,
    title: "La Primavera Soliveyra",
    composer: "A. Vivaldi"
  },
  {
    id: 59,
    title: "Aïda Solaekride",
    composer: "G. Verdi"
  },
  {
    id: 60,
    title: "Eine Kleine Nachtmusik Djagobe",
    composer: "W.A. Mozart"
  },
  {
    id: 61,
    title: "Liefde Is ...",
    composer: "Bonus track - Adya"
  },
  {
    id: 71,
    title: "Wings Of Summer",
    composer: "P. Sterman - E. Abrath"
  },
  {
    id: 72,
    title: "Tritsch Tratsch Phaeromidos",
    composer: "J. Strauss - Son"
  },
  {
    id: 73,
    title: "Out Of Africa Carafulia",
    composer: "W.A. Mozart"
  },
  {
    id: 74,
    title: "Alla Turca Ahriahne",
    composer: "W.A. Mozart"
  },
  {
    id: 75,
    title: "Light Cavalry Achrimides",
    composer: "F. Von Suppé"
  },
  {
    id: 76,
    title: "Barcarolle Ourybova",
    composer: "J.Offenbach"
  },
  {
    id: 77,
    title: "Toreador Atjenki",
    composer: "G. Bizet"
  },
  {
    id: 78,
    title: "Symphony N° 40 Xophoratis",
    composer: "W.A. Mozart"
  },
  {
    id: 79,
    title: "La Gazza Ladra Voladiche",
    composer: "G. Rossini"
  },
  {
    id: 80,
    title: "Aïda Solaekride",
    composer: "G. Verdi"
  },
  {
    id: 81,
    title: "La Primavera Soliveyra",
    composer: "A. Vivaldi"
  },
  {
    id: 82,
    title: "Morning Mood Trevobima",
    composer: "E.H. Grieg"
  },
  {
    id: 83,
    title: "The Emperor Muvagora",
    composer: "J. Strauss - Son"
  },
  {
    id: 84,
    title: "Ode To Joy Imar It Heri",
    composer: "L. von Beethoven"
  },
  {
    id: 85,
    title: "Romanza Zeyvolo",
    composer: "W.A. Mozart"
  },
  {
    id: 86,
    title: "Orpheus In The Underworld Nagodus",
    composer: "J. Offenbach"
  },
  {
    id: 87,
    title: "Dance Of The Hours Souraktoff",
    composer: "A. Ponchielli"
  },
  {
    id: 88,
    title: "Walz Of The Flowers Quosibatu",
    composer: "P.I. Tchaikovsky"
  },
  {
    id: 89,
    title: "Eine Kleine Nachtmusik Djagobe",
    composer: "W.A. Mozart"
  },
  {
    id: 90,
    title: "Hungarian Dance Netonkla",
    composer: "J. Brahms"
  },
  {
    id: 91,
    title: "Halleluyah",
    composer: "Adya - Classic Pop Mix"
  },
  {
    id: 101,
    title: "Funiculi Funiculà",
    composer: "Luigi Denza"
  },
  {
    id: 102,
    title: "Libiamo (Ne’ Lieti Calici)",
    composer: "La Traviata • Giuseppe Verdi"
  },
  {
    id: 103,
    title: "Largo Al Factotum",
    composer: "Il Barbiere Di Seviglia • Gioacchino Rossini"
  },
  {
    id: 104,
    title: "Der Vogelfänger",
    composer: "Die Zauberflöte • Wolfgang Amadeus Mozart",
    bestseller: true,
    itunes:
      "https://itunes.apple.com/be/album/der-f%C3%B6gelf%C3%A4nger/1105663868?i=1105664367"
  },
  {
    id: 105,
    title: "Prelude Act 1",
    composer: "La Traviata • Giuseppe Verdi"
  },
  {
    id: 106,
    title: "La Donna È Mobile",
    composer: "Rigoletto • Giuseppe Verdi"
  },
  {
    id: 107,
    title: "O Mio Babbino Caro",
    composer: "Gianni Schicchi • Giacomo Puccini"
  },
  {
    id: 108,
    title: "Ouverture",
    composer: "William Tell • Gioacchino Rossini",
    bestseller: true,
    itunes:
      "https://itunes.apple.com/be/album/william-tell-ouverture/1105663868?i=1105664371"
  },
  {
    id: 109,
    title: "Va, Pensiero",
    composer: "Nabucco • Giuseppe Verdi"
  },
  {
    id: 110,
    title: "Ouverture",
    composer: "Il Barbiere Di Seviglia • Gioacchino Rossini"
  },
  {
    id: 111,
    title: "The Pearl Fishers",
    composer: "Au Fond Du Temple Saint • Georges Bizet"
  },
  {
    id: 112,
    title: "Non Piu Andrai",
    composer: "Le Nozze Di Figaro • Wolfgang Amadeus Mozart"
  },
  {
    id: 113,
    title: "Plaisir D’Amour",
    composer: "Jean-Paul-Egide Martini"
  },
  {
    id: 114,
    title: "Di Provenza Il Mar, Il Suol",
    composer: "La Traviata • Giuseppe Verdi"
  },
  {
    id: 115,
    title: "Voi Che Sapete",
    composer: "Le Nozze di Figaro • Wolfgang Amadeus Mozart"
  },
  {
    id: 116,
    title: "The Bohemian Girl",
    composer: "I Dreamt I Dwelt In Marble Halls • Michael William Balfe"
  },
  {
    id: 117,
    title: "Adya Medley",
    composer:
      "Stars and Stripes • John Philip de Sousa • Mein Kleiner Gardeoffizier • Robert Stolz/Walter Reisch • Einzugsmarsch (Der Zigeunerbaron Opus 327) • Johann Strauss jr. • Radetzky Marsch • Johann Strauss sr.",
    bestseller: true,
    itunes:
      "https://itunes.apple.com/be/album/adya-medley/1105663868?i=1105664380"
  },
  {
    id: 121,
    title: "Die Lustige Witwe",
    composer: "(Frans Lehàr) Ludwig Kg Doblinger Musik Verlag"
  },
  {
    id: 122,
    title: "Strangers in the Night",
    composer: "(Berthold Kaempfert) Roosevelt/Champion Music"
  },
  {
    id: 123,
    title: "Swan Lake III - Spanish Dance, Pt. 6",
    composer: "(Pyotr Ilyich Tchaikovsky – Trad. Adapt. ADYA) Mouse Music Co."
  },
  {
    id: 124,
    title: "My Sarie Marais",
    composer: "(Trad. Adapt. Edwig Abrath) Mouse Music Co."
  },
  {
    id: 125,
    title: "Morst et Vita - Judex",
    composer:
      "(Charles François Gounod – Trad. Adapt. Phil Sterman/Edwig Abrath) Mouse Music Co."
  },
  {
    id: 126,
    title: "Flower Duet - Lakme Opera",
    composer: "(Léo Delibes – Trad. Adapt. ADYA) Mouse Music Co."
  },
  {
    id: 127,
    title: "Prince Igor - The Polovtsian Dances",
    composer:
      "(Alexander Borodin – Trad. Adapt. Phil Sterman/Edwig Abrath) Mouse Music Co."
  },
  {
    id: 128,
    title: "Rhapsody on a Theme of Paganini - Opus 43",
    composer:
      "(Sergei Rachmaninoff – Trad. Adapt. Phil Sterman/Edwig Abrath) Mouse Music Co."
  },
  {
    id: 129,
    title: "New World Symphony No. 9 in E Minor",
    composer:
      "(Antonin Dvoràk – Trad. Adapt. Phil Sterman/Edwig Abrath) Mouse Music Co."
  },
  {
    id: 130,
    title: "Horn Concerto No. 1 in D Major - K. 412 II. Rondo Allegro",
    composer: "(Wolfgang Amadeus Mozart - Trad. Adapt. ADYA) Mouse Music Co."
  },
  {
    id: 131,
    title: "Spanish Harlem",
    composer:
      "(Jerry Leiber/Phil Spector) Abkco Music Ltd./EMI Music Publishing"
  },
  {
    id: 132,
    title: "Marie Louise",
    composer: "(Armath) BMG Ariola/Rover Music."
  },
  {
    id: 133,
    title: "Love Is ...",
    composer: "(ADYA) Mouse Music Co."
  },
  {
    id: 134,
    title: "Matthaus-Passion - Mach Dich, Meine Herze, Rein",
    composer: "(Johann Sebastian Bach – Trad. Adapt. ADYA) Mouse Music Co."
  },
  {
    id: 135,
    title: "Halleluyah – Chorus Of The Messiah Part III",
    composer: "(Georg Friedrich Händel – Trad. Adapt. ADYA) Mouse Music Co."
  },
  {
    id: 136,
    title: "4 Themes Ouverture - Passion, Tenderness, Romance, Love",
    composer: "(ADYA) Mouse Music Co."
  },
  {
    id: 137,
    title: "Take Me for a Ride - Villa Rides",
    composer: "(Maurice-Alexis Jarre) Sony Atv Harmony",
    bestseller: true,
    itunes:
      "https://itunes.apple.com/be/album/take-me-for-a-ride-villa-rides/1272721675?i=1272721842"
  },
  {
    id: 138,
    title: "Cherubino's Aria - Djbom Mix",
    composer:
      "Non so piu cosa son cosa faccio – From “The Marriage of Figaro” Opera (Wolfgang Amadeus Mozart – Trad. Adapt: ADYA) Mouse Music Co.",
    bestseller: true,
    itunes:
      "https://itunes.apple.com/be/album/cherubinos-aria-djbommix/1272721675?i=1272721843"
  },
  {
    id: 139,
    title: "Anonymous Romance",
    composer: "(Trad. Adapt. Phil Sterman/Edwig Abrath) Mouse Music Co."
  },
  {
    id: 140,
    title: "Summertime Aria - Porgy And Bess Opera",
    composer: "(George Gershwin) Warner/Chappell Music"
  },
  {
    id: 141,
    title: "Harp Concerto 2017 - Alegro in Bb",
    composer:
      "(Georg Friedrich Händel – Trad. Adapt. Phil Sterman/Edwig Abrath) Mouse Music Co."
  },
  {
    id: 142,
    title: "Ruslan and Ludmilla 2017 - Ouverture",
    composer:
      "(Michail Ivanovich Glinka – Trad. Adapt. Phil Sterman/Edwig Abrath) Mouse Music Co."
  },
  {
    id: 143,
    title: "Alhambra 2017",
    composer:
      "(Francisco Tàrrega Eixea – Trad. Adapt. Phil Sterman/Edwig Abrath) Mouse Music Co."
  },
  {
    id: 144,
    title: "Swan Lake 2017",
    composer:
      "(Pyotr Ilyich Tchaikovsky – Trad. Adapt. Phil Sterman/Edwig Abrath) Mouse Music Co."
  },
  {
    id: 145,
    title: "Anna Magdalena",
    composer:
      "(Johann Sebastian Bach – Trad. Adapt. Phil Sterman/Edwig Abrath) Mouse Music Co."
  },
  {
    id: 146,
    title: "Mull of Kintyre",
    composer:
      "(Paul McCartney & Denny Laine) McCartney Music/EMI Music Publishing",
    bestseller: true,
    itunes:
      "https://itunes.apple.com/be/album/mull-of-kintyre/1272721675?i=1272721851"
  },
  {
    id: 147,
    title: "Winter Wonderland",
    composer: "(Trad. Adapt. ADYA) Mouse Music Co."
  },
  {
    id: 148,
    title: "Wiegenlied",
    composer:
      "(Johannes Brahms – Trad. Adapt Phil Sterman/Edwig Abrath) Mouse Music Co."
  },
  {
    id: 149,
    title: "Silent Night",
    composer:
      "(Franz Xaver Gruber – Trad. Adapt Phil Sterman/Edwig Abrath) Mouse Music Co."
  },
  {
    id: 150,
    title: "Adeste Fideles/Gloria in Excelsis Deo",
    composer: "(Trad. Adapt. Phil Sterman/Edwig Abrath) Mouse Music Co."
  }
];

App.Tour.FIXTURES = [];

App.Video.FIXTURES = [
  {
    id: 3,
    title: "TV Clip (LIVE)",
    thumbnail: "videos/3-thumb.jpg",
    src: "http://www.youtube.com/watch?v=rCYhpqw7MSs",
    album: 1
  },
  {
    id: 13,
    title: "TV Clip (LIVE)",
    thumbnail: "videos/13-thumb.jpg",
    src: "http://www.youtube.com/watch?v=tiCsEsVSSHs",
    album: 2
  },
  {
    id: 23,
    title: "TV Clip (LIVE)",
    thumbnail: "videos/23-thumb.jpg",
    src: "https://www.youtube.com/watch?v=m5eIvVwQCKw",
    album: 3
  },
  {
    id: 31,
    title: "Opera",
    thumbnail: "videos/31-thumb.jpg",
    src: "http://vimeo.com/69101584",
    album: 5
  },
  {
    id: 32,
    title: "Largo Al Factotum",
    thumbnail: "videos/32-thumb.jpg",
    src: "https://vimeo.com/70574325",
    album: 5
  },
  {
    id: 41,
    title: "Medley 29.06.2013",
    thumbnail: "videos/41-thumb.jpg",
    src: "http://vimeo.com/69424318"
  },
  {
    id: 42,
    title: "Medley 02.06.2012",
    thumbnail: "videos/42-thumb.jpg",
    src: "http://www.youtube.com/watch?v=qnK1uVQyvKI"
  },
  {
    id: 43,
    title: "Medley 2011",
    thumbnail: "videos/43-thumb.jpg",
    src: "http://www.youtube.com/watch?v=_UFcL-FfRaI"
  },
  {
    id: 44,
    title: "",
    thumbnail: "videos/44-thumb.jpg",
    src: "http://www.youtube.com/watch?v=1UZfanXM3zs"
  },
  {
    id: 45,
    title: "ADYA & Manuel Palomo",
    thumbnail: "videos/45-thumb.jpg",
    src: "https://www.youtube.com/watch?v=SxgAS7lw76U"
  },
  {
    id: 51,
    title: "ADYA Testament",
    thumbnail: "videos/51-thumb.jpg",
    src: "https://www.youtube.com/watch?v=4Zc_IA6priY"
  }
];

App.Photo.FIXTURES = [
  {
    id: 1,
    thumbnail: "photos/1-thumb.jpg",
    src: "photos/1.jpg",
    album: 1
  },
  {
    id: 2,
    thumbnail: "photos/2-thumb.jpg",
    src: "photos/2.jpg",
    album: 1
  },
  {
    id: 3,
    thumbnail: "photos/3-thumb.jpg",
    src: "photos/3.jpg",
    album: 1
  },
  {
    id: 4,
    thumbnail: "photos/4-thumb.jpg",
    src: "photos/4.jpg",
    album: 1
  },
  {
    id: 5,
    thumbnail: "photos/5-thumb.jpg",
    src: "photos/5.jpg",
    album: 1
  },
  {
    id: 6,
    thumbnail: "photos/6-thumb.jpg",
    src: "photos/6.jpg",
    album: 1
  },
  {
    id: 7,
    thumbnail: "photos/7-thumb.jpg",
    src: "photos/7.jpg",
    album: 1
  },
  {
    id: 8,
    thumbnail: "photos/8-thumb.jpg",
    src: "photos/8.jpg",
    album: 1
  },
  {
    id: 9,
    thumbnail: "photos/9-thumb.jpg",
    src: "photos/9.jpg",
    album: 1
  },
  {
    id: 10,
    thumbnail: "photos/10-thumb.jpg",
    src: "photos/10.jpg",
    album: 1
  },
  {
    id: 11,
    thumbnail: "photos/11-thumb.jpg",
    src: "photos/11.jpg",
    album: 1
  },
  {
    id: 21,
    thumbnail: "photos/21-thumb.jpg",
    src: "photos/21.jpg",
    album: 2
  },
  {
    id: 22,
    thumbnail: "photos/22-thumb.jpg",
    src: "photos/22.jpg",
    album: 2
  },
  {
    id: 23,
    thumbnail: "photos/23-thumb.jpg",
    src: "photos/23.jpg",
    album: 2
  },
  {
    id: 24,
    thumbnail: "photos/24-thumb.jpg",
    src: "photos/24.jpg",
    album: 2
  },
  {
    id: 25,
    thumbnail: "photos/25-thumb.jpg",
    src: "photos/25.jpg",
    album: 2
  },
  {
    id: 26,
    thumbnail: "photos/26-thumb.jpg",
    src: "photos/26.jpg",
    album: 2
  },
  {
    id: 27,
    thumbnail: "photos/27-thumb.jpg",
    src: "photos/27.jpg",
    album: 2
  },
  {
    id: 28,
    thumbnail: "photos/28-thumb.jpg",
    src: "photos/28.jpg",
    album: 2
  },
  {
    id: 31,
    thumbnail: "photos/31-thumb.jpg",
    src: "photos/31.jpg"
  },
  {
    id: 32,
    thumbnail: "photos/32-thumb.jpg",
    src: "photos/32.jpg"
  }
];
