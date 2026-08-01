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
  book: BookPDF
) {

  const pdf = new jsPDF();


  /*
    COVER PAGE
  */

  if (book.cover_url) {

    try {

      pdf.addImage(
        book.cover_url,
        "JPEG",
        0,
        0,
        210,
        297
      );

    } catch (error) {

      console.error(
        "Cover image failed:",
        error
      );

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

  } else {

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



      // Add new page only if not the last chapter

      if(index < book.chapters.length - 1){

        pdf.addPage();

      }


    }

  );


  return pdf;

}



// Used by EditBook.tsx

export async function createBookPDF(
  book:any,
  chapters:any[]
){

  const pdf = generateBookPDF({

    title: book.title,

    author: book.author_name || book.author,

    cover_url: book.cover_url,

    chapters: chapters

  });


  pdf.save(
    `${book.title}.pdf`
  );

}