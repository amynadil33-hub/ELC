import { supabase } from "@/lib/supabase";
import { generateBookPDF } from "./pdfService";



export async function createBookPDF(
book:any,
chapters:any[]
){


const pdf =
generateBookPDF({

title: book.title,

author: book.author_name,

cover_url: book.cover_url,

chapters

});



const blob =
pdf.output(
"blob"
);



const fileName =
`${book.id}.pdf`;



const { error } = await supabase.storage

.from("ebooks")

.upload(
fileName,
blob,
{
contentType:"application/pdf",
upsert:true
}
);


if (error) {
  console.error("STORAGE ERROR:", error);
  throw error;
}

console.log("Storage upload succeeded");



const {
data
}
=
supabase.storage

.from("ebooks")

.getPublicUrl(
fileName
);



const { error: updateError } = await supabase
  .from("books")
  .update({
    pdf_url: data.publicUrl
  })
  .eq("id", book.id);

if (updateError) {
  console.error("BOOK UPDATE ERROR:", updateError);
  throw updateError;
}



return data.publicUrl;


}