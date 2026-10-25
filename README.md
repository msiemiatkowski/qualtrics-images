# Qualtrics images

Images for our Qualtrics surveys, served fast by GitHub Pages.

**Gallery with copy-ready links: https://msiemiatkowski.github.io/qualtrics-images/**

Every file in the `images` folder gets a direct link, for example:

```
https://msiemiatkowski.github.io/qualtrics-images/images/dominance/0000_neg1.7.png
```

## Add images

1. Open the gallery and click **Add images**, or go straight to
   https://github.com/msiemiatkowski/qualtrics-images/upload/main/images
2. Drag image files, or a whole folder, onto the page. A dropped folder becomes a sub-folder, e.g. `images/my-study/`.
3. Click **Commit changes**.
4. About a minute later the images are live. Refresh the gallery to copy their links.

## Use in Qualtrics

- **One image in a question:** click **Copy HTML** under the image, then paste it into the question's Rich Content Editor in the HTML (Source) view.
- **Many links at once** (Loop & Merge, embedded data, a spreadsheet): filter the gallery, then **Copy all links** or **Download CSV**.
- **Make images appear instantly:** click **Copy preload code** and paste it into the JavaScript of a question that comes before the images, such as the instructions page. Participants' browsers then download the images in the background while they read.

## Good to know

- Links are case-sensitive and change if a file is renamed or moved. Once a survey uses a link, leave that file where it is.
- Plain file names (letters, numbers, `-`, `_`, `.`) are safest. Names starting with `_` or `.` are not published.
- To remove an image, open it in the [`images` folder](https://github.com/msiemiatkowski/qualtrics-images/tree/main/images), use the `···` menu → **Delete file**, and commit. Surveys still using its link will show a broken image.
- Limits: 25 MB per file when uploading in the browser, about 1 GB for the whole site, and a soft limit of 100 GB of traffic per month (roughly 80,000 views of a 1.2 MB image).
- The repository is public, so anyone can see these images.

## How it works

GitHub Pages rebuilds the site after every commit. `index.html` gets the list of files in `images/` from Jekyll, which GitHub Pages runs automatically, and `assets/app.js` turns that list into the gallery. Nothing needs installing.
