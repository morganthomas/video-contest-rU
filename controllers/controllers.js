var _ = require('lodash');
var getYouTubeVideoIDFromURL = require('../youtube-url.js');
var instantRunoff = require('../instant-runoff.js');

// Videos are objects with properties submitterName, title, youtubeVideoID.

var NUM_SUBMISSIONS_TO_ACCEPT = 8;

var ContestStatus = {
  acceptingSubmissions: 'accepting submissions',
  voting: 'voting',
  done: 'done'
};

var contest = {};

var resetContest = function() {
	contest.status = ContestStatus.acceptingSubmissions;
	contest.winner = null;
	contest.submissionsInRunning = [];
  contest.ballots = [];
}

resetContest();

var contestViewInfo = {
  ContestStatus: ContestStatus,
  contest: contest
};

var controllers = {
  index: function(req, res) {
    if (contest.status === ContestStatus.voting && contest.ballots.length > 0) {
      var winnerID = instantRunoff.instantRunoffWinner(
        contest.submissionsInRunning.map(function(video) {
          return video.youtubeVideoID;
        }),
        contest.ballots);

      contest.winner = _.find(contest.submissionsInRunning, function(video) {
        return video.youtubeVideoID === winnerID;
      });
    }

    res.render('index', contestViewInfo);
  },

	submit: function(req, res) {
		res.render('submit');
	},

	submitAction: function(req, res) {
		var videoID = getYouTubeVideoIDFromURL(req.body['youtube-url']);

		if (contest.status === ContestStatus.acceptingSubmissions && videoID) {
			contest.submissionsInRunning.unshift({
				submitterName: req.body['submitter-name'],
				title: req.body['title'],
				youtubeVideoID: videoID
			});

			if (contest.submissionsInRunning.length >= NUM_SUBMISSIONS_TO_ACCEPT) {
				contest.status = ContestStatus.voting;
			}
		}

		res.redirect('/');
	},

	vote: function(req, res) {
		if (contest.status === ContestStatus.voting) {
			res.render('vote', { videos: contest.submissionsInRunning })
		} else {
      res.send("Not voting right now!");
    }
	},

  submitVote: function(req, res) {
    if (contest.status === ContestStatus.voting) {
      contest.ballots.push(req.body['videoList[]']);
    }

    res.send('');
  },

	restart: function(req, res) {
		resetContest();
		res.redirect('/');
	}
};

module.exports = controllers;
