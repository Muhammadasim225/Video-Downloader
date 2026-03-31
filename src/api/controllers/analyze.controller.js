const { analyzeVideo } = require("../../services/analyze.service");

exports.analyze = async (req, res) => {

  try {

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL required"
      });
    }

    const data = await analyzeVideo(url);

    res.json({
      success: true,
      data
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.toString()
    });

  }

};