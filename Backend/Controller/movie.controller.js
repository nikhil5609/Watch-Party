const Movie = require("../Model/movie.model");
const { deleteFromTigris } = require("../Utils/deleteFromTigris");
const {  uploadVideo } = require("../Utils/Upload");

const addMovie = async (req, res) => {
    try {
        const { movieName, thumb } = req.body;
        const uploadedBy = req?.user?._id;
        const filePath = req?.file?.path

        // 🔴 Validation
        if (!movieName || !uploadedBy || !filePath) {
            return res.status(400).json({
                status: "failed",
                message: "Movie details are incomplete"
            });
        }
        
        // 🟢 Create movie payload
        const videoKey = await uploadVideo(filePath);
        if(!videoKey) return res.status(400).json({
            status: "failed",
            message: "Upload Failed"
        })
        const details = {
            movieName,
            movieKey: videoKey,
            uploader: uploadedBy,
            ...(thumb && { thumb })
        };
        // 🟢 Save movie
        const movie = await Movie.create(details);
        if (!movie) {
            return res.status(500).json({
                status: "failed",
                message: "Failed to save movie information"
            });
        }
        
        const allMovies = await Movie.find()
        .populate('uploader', 'username');
        
        return res.status(201).json({
            status: "success",
            message: "Movie uploaded successfully",
            movies: allMovies
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error"
        });
    }
};

const getMovies = async (req,res) => {
    try {
        const movies = await Movie.find().populate('uploader','username');
        if(!movies){
            return res.status(400).json({status: "failed",message: "Failed to retreive movies"});
        }
        res.status(200).json({status: "success",message: "Movies Information Retireved",movies})
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error"
        });
    }
}

const deleteMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;
    
    const movie = await Movie.findById(movieId);
 
    if (!movie) {
      return res.status(404).json({ status: "failed", message: "Movie not found" });
    }
 
    // Only the uploader can delete their own movie
    if (movie.uploader.toString() !== userId.toString()) {
      return res.status(403).json({ status: "failed", message: "Not authorized to delete this movie" });
    }

    const temp = await deleteFromTigris(movie?.movieKey);
    console.log(temp);
    
 
    await Movie.findByIdAndDelete(movieId);
 
    const allMovies = await Movie.find().populate('uploader', 'username');
 
    return res.status(200).json({
      status: "success",
      message: "Movie deleted successfully",
      movies: allMovies,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

module.exports = {
    addMovie,
    getMovies,
    deleteMovie
};