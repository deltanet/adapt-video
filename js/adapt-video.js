define(function(require) {

    var ComponentView = require('coreViews/componentView');
    var Adapt = require('coreJS/adapt');

    var froogaloopAdded = false;

    var Video = ComponentView.extend({

        events: {
            "click .video-overlay-button": "playVideo",
            "click video": "onPlayPause",
            "click .video-progressBar": "progressDown",
            "click .video-inline-transcript-button": "onToggleInlineTranscript"
        },

        preRender: function() {
            this.listenTo(Adapt, 'device:resize', this.onScreenSizeChanged);
            this.listenTo(Adapt, 'accessibility:toggle', this.onAccessibilityToggle);
            // Listen for notify closing
            this.listenTo(Adapt, 'popup:closed', this.notifyClosed);
            // Listen for notify opening
            this.listenTo(Adapt, 'popup:opened', this.notifyOpened);

            this.checkIfResetOnRevisit();
        },

        postRender: function() {
            this.setupPlayer();

            if ($('body').children('.notify').css('visibility') == 'visible') {
                this.notifyOpened();
            }
        },

        notifyOpened: function() {
            this.notifyIsOpen = true;
            this.playMediaElement(false);
        },

        notifyClosed: function() {
            this.notifyIsOpen = false;

            if (this.model.get('_autoPlay') && this.videoIsInView == true && this.mediaCanAutoplay) {
                this.playMediaElement(true);
            }
        },

        setupPlayer: function() {
          this.notifyIsOpen = false;

          this.timeDrag = false;

          this.mediaAutoplayOnce = this.model.get('_autoPlayOnce');

          this.mediaCanAutoplay = this.model.get('_autoPlay');

          // Make reference to video
          this.video = this.$('video')[0];

          this.video.controls = false;

          this.setReadyStatus();

          this.onScreenSizeChanged();

          this.setupEventListeners();
        },

        onPlayPause: function(event) {
          if (event) event.preventDefault();

          if(this.video.paused) {
              this.playVideo();
          } else {
              this.pauseVideo();
          }
        },

        playVideo: function() {
          this.video.play();
          this.$('.video-overlay-button').addClass("playing");
          this.$('.video-progressBar').removeClass("completed");
        },

        pauseVideo: function() {
          this.video.pause();
          this.$('.video-overlay-button').removeClass("playing");
          this.$('.video-progressBar').addClass("completed");
        },

        updateProgress: function() {
           var value = 0;
           var $progress = this.$el.find(".video-progress");
           if (this.video.currentTime > 0) {
              value = Math.floor((100 / this.video.duration) * this.video.currentTime);
           }
           $progress.css("width", value + "%");
        },

        updatebar: function(value) {
          var element = this.$el.find(".video-progressBar");
          var elementWidth = element.width();

          var position = Math.round((100 / elementWidth) * value);

          var videoduration = this.video.duration;

          this.video.currentTime = videoduration * position / 100;
        },

        progressDown: function(event) {
          if (event) event.preventDefault();

          var offset = this.$('.video-progress').offset();
          var xPos = event.pageX - offset.left;

          this.updatebar(xPos);
        },

        setupEventListeners: function() {
            this.completionEvent = (!this.model.get('_setCompletionOn')) ? 'play' : this.model.get('_setCompletionOn');

            this.$('video').on('ended', _.bind(this.onCompletion, this));
            this.$('video').on('timeupdate', _.bind(this.updateProgress, this));
            this.$('.component-widget').on('inview', _.bind(this.inview, this));
        },

        checkIfResetOnRevisit: function() {
            var isResetOnRevisit = this.model.get('_isResetOnRevisit');

            // If reset is enabled set defaults
            if (isResetOnRevisit) {
                this.model.reset(isResetOnRevisit);
            }
        },

        inview: function(event, visible, visiblePartX, visiblePartY) {
            if (visible) {
                if (visiblePartY === 'top' || visiblePartY === 'both') {
                    this._isVisibleTop = true;
                } else {
                    this._isVisibleTop = false;
                }
                if (this._isVisibleTop) {
                    if (this.model.get('_autoPlay') && this.notifyIsOpen == false && this.mediaCanAutoplay == true) {
                        this.playMediaElement(true);
                    }
                    if (this.model.get('_setCompletionOn') == 'inview') {
                        this.setCompletionStatus();
                    }
                    this.$('.component-inner').off('inview');
                    this.videoIsInView = true;
                } else {
                    this.playMediaElement(false);
                    this.videoIsInView = false;
                }
            } else {
                this.playMediaElement(false);
                this.videoIsInView = false;
            }
        },

        playMediaElement: function(state) {
            if (this.model.get('_isVisible') && state) {
                this.playVideo();
                // Set to false to stop autoplay when inview again
                if(this.mediaAutoplayOnce) {
                    this.mediaCanAutoplay = false;
                }
            } else if (state === false) {
                this.pauseVideo();
            }
        },

        remove: function() {
            ComponentView.prototype.remove.call(this);
        },

        onCompletion: function() {
            this.setCompletionStatus();
            this.$('.video-progressBar').addClass("completed");
        },

        onScreenSizeChanged: function() {
            this.$('audio, video').width(this.$('.component-widget').width());
        },

        onAccessibilityToggle: function() {

        },

        onToggleInlineTranscript: function(event) {
            if (event) event.preventDefault();
            var $transcriptBodyContainer = this.$(".video-inline-transcript-body-container");
            var $button = this.$(".video-inline-transcript-button");

            if ($transcriptBodyContainer.hasClass("inline-transcript-open")) {
                $transcriptBodyContainer.slideUp(function() {
                    $(window).resize();
                });
                $transcriptBodyContainer.removeClass("inline-transcript-open");
                $button.html(this.model.get("_transcript").inlineTranscriptButton);
            } else {
                $transcriptBodyContainer.slideDown(function() {
                    $(window).resize();
                }).a11y_focus();
                $transcriptBodyContainer.addClass("inline-transcript-open");
                $button.html(this.model.get("_transcript").inlineTranscriptCloseButton);
                if (this.model.get('_transcript')._setCompletionOnView !== false) {
                    this.setCompletionStatus();
                }
            }
        }

    });

    Adapt.register('video', Video);

    return Video;

});
