import { jsPDF } from "jspdf";


interface Chapter {
  title:string;
  content:string;
}


interface BookPDF {
  title:string;
  author:string;
  cover_url?:string;
  chapters:Chapter[];
}



export function generateBookPDF(
  book:BookPDF
){

  const pdf = new jsPDF();


  /*
    COVER PAGE
  */

  if(book.cover_url){

    pdf.addImage(
      book.cover_url,
      "JPEG",
      0,
      0,
      210,
      297
    );

  }
  else {

    pdf.setFontSize(24);

    pdf.text(
      book.title,
      20,
      40
    );


    pdf.setFontSize(14);

    pdf.text(
      `By ${book.author}`,
      20,
      60
    );

  }



  /*
    CONTENT STARTS ON NEW PAGE
  */

  pdf.addPage();



  book.chapters.forEach(
    (chapter,index)=>{


      pdf.setFontSize(18);


     const chapterTitle =
  `Chapter ${index + 1}: ${chapter.title}`;

const titleLines =
  pdf.splitTextToSize(
    chapterTitle,
    170
  );

pdf.text(
  titleLines,
  20,
  30
);


pdf.setFontSize(12);


const lines =
  pdf.splitTextToSize(
    chapter.content,
    170
  );


let y = 45 + (titleLines.length * 8);


lines.forEach((line:string)=>{

  if(y > 270){

    pdf.addPage();

    y = 30;

  }

  pdf.text(
    line,
    20,
    y
  );

  y += 7;

});



      // New page for next chapter

      pdf.addPage();


    }
  );



  return pdf;

}