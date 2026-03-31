const { exec } = require("child_process");

exports.analyzeVideo = (url) => {
  return new Promise((resolve, reject) => {

    const command = `yt-dlp --dump-json "${url}"`;

    exec(command, (err, stdout, stderr) => {

      if (err) {
        return reject(stderr);
      }

      const data = JSON.parse(stdout);

      resolve({
        title: data.title,
        duration: data.duration,
        thumbnail: data.thumbnail,
        uploader: data.uploader,
        webpage_url: data.webpage_url
      });

    });

  });
};