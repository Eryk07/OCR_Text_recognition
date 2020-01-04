function DisplayText(imguri){
    document.write(imguri);
    ShowImage(imguri)    
}

function ShowImage(src) {
    var img = document.createElement("img");
    img.src = src;

    // This next line will just add it to the <body> tag
    document.body.appendChild(img);
}
