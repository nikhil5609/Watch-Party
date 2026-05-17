const Movie = require("../Model/movie.model");
const { uploadToCloudinary } = require("../Utils/Upload");

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
        const url = await uploadToCloudinary(filePath);
        console.log(url);
        
        const details = {
            movieName,
            movieUrl: url,
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
        console.error(error);
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

module.exports = {
    addMovie,
    getMovies
};