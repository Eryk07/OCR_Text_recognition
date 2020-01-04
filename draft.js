//PHP / JS System OCR (rozpoznawanie tekstu). 
//Po wgraniu zdjęcia system ma zbudować stronę HTML z tekstami ze zdjęcia (polecam użyć Google Vision)

// Get a reference to the Cloud Vision API component
const Vision = require('@google-cloud/vision');
const vision = new Vision.ImageAnnotatorClient();

const request = {
    image: {
      source: {imageUri: 'https://www.w3.org/TR/SVG/images/text/text-wrap-circle.png'}
    }
  };

vision
  .textDetection(request)
  .then(response => {
    // doThingsWith(response);
    document.write("to ju")
  })
  .catch(err => {
    console.error(err);
  });


 /**
 * This function is exported by index.js, and is executed when
 * a file is uploaded to the Cloud Storage bucket you created
 * for uploading images.
 *
 * @param {object} event.data (Node 6) A Google Cloud Storage File object.
 * @param {object} event (Node 8+) A Google Cloud Storage File object.
 */

exports.processImage = event => {
    const file = event.data || event;
  
    return Promise.resolve()
      .then(() => {
        if (file.resourceState === 'not_exists') {
          // This was a deletion event, we don't want to process this
          return;
        }
  
        if (!file.bucket) {
          throw new Error(
            'Bucket not provided. Make sure you have a "bucket" property in your request'
          );
        }
        if (!file.name) {
          throw new Error(
            'Filename not provided. Make sure you have a "name" property in your request'
          );
        }
  
        return detectText(file.bucket, file.name);
      })
      .then(() => {
        console.log(`File ${file.name} processed.`);
      });
  };

/**
 * Detects the text in an image using the Google Vision API.
 *
 * @param {string} bucketName Cloud Storage bucket name.
 * @param {string} filename Cloud Storage file name.
 * @returns {Promise}
 */
function detectText(bucketName, filename) {
    let text;
  
    console.log(`Looking for text in image ${filename}`);
    return vision
      .textDetection(`gs://${bucketName}/${filename}`)
      .then(([detections]) => {
        const annotation = detections.textAnnotations[0];
        text = annotation ? annotation.description : '';
        console.log(`Extracted text from image (${text.length} chars)`);
        return translate.detect(text);
      })
      .then(([detection]) => {
        if (Array.isArray(detection)) {
          detection = detection[0];
        }
        console.log(`Detected language "${detection.language}" for ${filename}`);
  
        // Submit a message to the bus for each language we're going to translate to
        const tasks = config.TO_LANG.map(lang => {
          let topicName = config.TRANSLATE_TOPIC;
          if (detection.language === lang) {
            topicName = config.RESULT_TOPIC;
          }
          const messageData = {
            text: text,
            filename: filename,
            lang: lang,
          };
  
          return publishResult(topicName, messageData);
        });
  
        return Promise.all(tasks);
      });
  }