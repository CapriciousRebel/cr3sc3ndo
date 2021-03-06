import fs from "fs";
import cp from "child_process";

// Receives a file from request and saves it in /uploads/<sessionID>/
export const upload = async (req, res) => {
  try {
    console.log(req.file);
    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }

    cp.exec("cd ../spleeterenv/bin/; ./python3 spleeter separate -i ../../cr3sc3ndo/uploads/" + req.sessionID + "/" + req.file.originalname + " -p spleeter:5stems -o ../../cr3sc3ndo/uploads/" + req.sessionID + ";cd ../../cr3sc3ndo; mv ./uploads/" + req.sessionID + "/" + req.file.originalname + " ./uploads/" + req.sessionID + "/song.mp3", "/bin/bash", (data, stderr, std) => {
      console.log(data + std + stderr);
      res.status(200).send({
        message: "Uploaded the file successfully: " + req.file.originalname,
        client_id: req.sessionID,
        output_folder: req.file.originalname.split(".")[0],
      });
    });

  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file: ${req.file.originalname}. ${err}`,
    });
  }
};

// returns all the files generated by speeter
export const getListFiles = (req, res) => {
  const directoryPath =
    __basedir +
    "/uploads/" +
    req.query.client_id +
    "/" +
    req.query.output_folder +
    "/";

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      res.status(500).send({
        message: "Unable to scan files!",
      });
    }

    let fileInfos = [];

    files.forEach((file) => {
      fileInfos.push({
        name: file,
        url:
          __baseURL +
          "/uploads/" +
          req.query.client_id +
          "/" +
          req.query.output_folder +
          "/" +
          file,
      });
    });
    res.status(200).send(fileInfos);
  });
};

// returns the link to final mp4 file
export const getOutputFile = (req, res) => {
  console.log("<<getOutputFile>>")

  let filePath = __basedir + "/uploads/" +
    req.query.client_id +
    "/output.mp4"

  if (fs.existsSync(filePath)) {
    console.log("File Found!")
    return res.status(200).send({
      url: __baseURL +
        "/uploads/" +
        req.query.client_id +
        "/output.mp4"
    });
  }
  else {
    console.log("File Not Found!")
    return res.status(404)
  }
}

// writes the data.txt file in /uploads/<client_id>
export const chooseTemplate = async (req, res) => {
  let data =
    "scale: " +
    req.body.scale +
    ".txt\nbloom: " +
    req.body.water +
    ".txt\nvibrate: " +
    req.body.particles + ".txt";

  fs.writeFile(
    __basedir + "/uploads/" + req.body.client_id + "/data.txt",
    data,
    (err) => {
      return err
        ? res.status(500).send({ Status: "Failed to write file!" })
        : console.log("file written");
    }
  );

  // parse the data.txt and start the processing command here
  cp.exec("python3 audio_to_text.py uploads/" + req.body.client_id + "/ >A; echo \"../crescndo-final/cr3sc3ndo/uploads/" + req.body.client_id + "\">../../sketch_201025a/path.txt; xvfb-run /home/meet/processing-3.5.4/processing-java --sketch=/home/meet/sketch_201025a --run>A2 && cp ../../sketch_201025a/processing-movie.mp4 uploads/" + req.body.client_id + "/ ; ffmpeg -i processing-video.mp4 -i song.mp3 -map 0:v -map 1:a -c:v copy -shortest output.mp4", "/bin/bash", (data, stderr, std) => {
    console.log(data + err + std);
  });
};