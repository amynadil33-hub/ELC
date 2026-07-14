import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";
import { useNavigate, useParams } from "react-router-dom";
import { createBookPDF } from "@/services/bookPdfUpload";


interface Chapter {
  id?: string;
  title: string;
  content: string;
  chapter_order: number;
}


interface Book {
  id: string;
  title: string;
  description: string;
  author_name: string;
  author_email: string;
  published: boolean;
  cover_url?: string;
}



export default function EditBook() {


  const { id } = useParams();

  const navigate = useNavigate();


  const [book,setBook] = useState<Book | null>(null);

  const [chapters,setChapters] = useState<Chapter[]>([]);

  const [loading,setLoading] = useState(true);

  const [saving,setSaving] = useState(false);
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");


useEffect(()=>{

  if(id){
    loadBook();
  }

},[id]);



  async function loadBook(){


    const {
      data:{user}
    } = await supabase.auth.getUser();



    if(!user){

      navigate("/login");
      return;

    }



    const {
      data:bookData,
      error:bookError
    } = await supabase

      .from("books")

      .select("*")

      .eq("id",id)

      .single();



    if(bookError){

      alert(bookError.message);
      return;

    }



    if(
      bookData.author_email !== user.email
    ){

      alert(
        "You cannot edit this book."
      );

      navigate("/authorsofelc");

      return;

    }



    setBook(bookData);

setCoverPreview(
  bookData.cover_url
    ? `${bookData.cover_url}?t=${Date.now()}`
    : "/images/ebook-placeholder.jpg"
);



    const {
      data:chapterData
    } = await supabase

      .from("chapters")

      .select("*")

      .eq("book_id",id)

      .order(
        "chapter_order",
        {
          ascending:true
        }
      );



    setChapters(
      chapterData || []
    );


    setLoading(false);


  }




  function updateChapter(
    index:number,
    field:keyof Chapter,
    value:string
  ){


    const updated=[
      ...chapters
    ];


    updated[index]={
      ...updated[index],
      [field]:value
    };


    setChapters(updated);


  }





  function addChapter(){


    setChapters([

      ...chapters,

      {
        title:"",
        content:"",
        chapter_order:
          chapters.length+1
      }

    ]);


  }

async function uploadCover(){

  if(!cover || !book) {
    return book?.cover_url;
  }

const cleanName = cover.name.replace(/\s+/g,"-");

const fileName =
  `${book.id}-${Date.now()}-${cleanName}`;


  const {
    error:uploadError
  } = await supabase.storage

    .from("book-covers")

    .upload(
      fileName,
      cover,
      {
        upsert:true
      }
    );


  if(uploadError){

    throw uploadError;

  }


  const {
    data
  } = supabase.storage

    .from("book-covers")

    .getPublicUrl(fileName);


  return data.publicUrl;

}





async function saveBook(){

  setSaving(true);


  try {


    let newCoverUrl = book?.cover_url;



    // Upload new cover if selected
    if(cover){

      newCoverUrl = await uploadCover();

    }




    // Save chapters
    let savedChapters = [...chapters];
    for(
      let i = 0;
      i < chapters.length;
      i++
    ){

      const chapter = chapters[i];



      if(chapter.id){


        const {
          error
        } = await supabase

          .from("chapters")

          .update({

            title: chapter.title,

            content: chapter.content,

            chapter_order: i + 1

          })

          .eq(
            "id",
            chapter.id
          );



        if(error){

          console.error(
            "CHAPTER UPDATE ERROR:",
            error
          );

          throw error;

        }



      }
      else {



        const {
          data:newChapter,
          error
        } = await supabase

          .from("chapters")

          .insert({

            book_id:id,

            title:chapter.title,

            content:chapter.content,

            chapter_order:i + 1

          })

          .select()

          .single();




        if(error){

          console.error(
            "CHAPTER INSERT ERROR:",
            error
          );

          throw error;

        }



        if(newChapter){

   savedChapters[i] = {
  ...savedChapters[i],
  id: newChapter.id
};

        }


      }


    } // end chapters loop





    // Update cover URL
    if(newCoverUrl && book){


      const {
        error
      } = await supabase

        .from("books")

        .update({

          cover_url:newCoverUrl

        })

        .eq(
          "id",
          book.id
        );



      if(error){

        throw error;

      }



      setBook({

        ...book,

        cover_url:newCoverUrl

      });


    }






    // Generate PDF
    if(book && chapters.length > 0){


await createBookPDF(
  {
    ...book,
    cover_url: newCoverUrl || ""
  },
  savedChapters
);


    }




    alert(
      "Book saved and PDF generated successfully"
    );




setCover(null);
await loadBook();

return true;



  }
  catch(error:any){


    console.error(error);



    alert(

      error.message ||

      "Unable to save book"

    );



    return false;



  }
  finally{


    setSaving(false);


  }


}

async function publishBook(){

  const saved = await saveBook();


  if(!saved){

    return;

  }



  const confirmPublish =
    confirm(
      "Publish this book? It will become visible to students."
    );


  if(!confirmPublish){

    return;

  }



  const {
    error
  } = await supabase

    .from("books")

    .update({
      published:true
    })

    .eq(
      "id",
      id
    );



  if(error){

    console.error(error);

    alert(
      error.message
    );

    return;

  }

  alert("Book published successfully!");

  navigate("/my-books");

}





  if(loading){

    return (

      <Layout>

        <div className="p-10 text-center">

          Loading...

        </div>

      </Layout>

    );

  }




  return (

    <Layout>


      <div className="
      max-w-5xl
      mx-auto
      p-6
      ">


        <h1 className="
        text-3xl
        font-bold
        text-[#1F6F43]
        mb-6
        ">

          Edit Book

        </h1>



        <input

          className="
          w-full
          border
          p-3
          rounded-lg
          mb-4
          "

          value={
            book?.title || ""
          }

          readOnly

        />



{/* COVER UPLOAD GOES HERE */}

<div className="mb-6">

  <img
    src={
      coverPreview ||
      "/images/ebook-placeholder.jpg"
    }
    className="
    w-40
    h-56
    object-cover
    rounded-lg
    mb-3
    "
  />


  <label
    className="
    block
    border
    p-3
    rounded-lg
    cursor-pointer
    bg-gray-50
    "
  >

    {
      cover
      ?
      cover.name
      :
      "Change book cover"
    }


    <input

      type="file"

      accept="image/*"

      className="hidden"

      onChange={(e)=>{

        const file =
        e.target.files?.[0] || null;


        setCover(file);


        if(file){

          setCoverPreview(
            URL.createObjectURL(file)
          );

        }

      }}

    />

  </label>

</div>


        {
          chapters.map(
            (chapter,index)=>(


            <div
              key={index}
              className="
              border
              rounded-lg
              p-5
              mb-5
              "
            >


              <h2 className="
              font-bold
              mb-3
              ">

                Chapter {index+1}

              </h2>



              <input

                className="
                w-full
                border
                p-3
                rounded-lg
                mb-3
                "

                placeholder="Chapter title"

                value={
                  chapter.title
                }

                onChange={
                  e=>
                  updateChapter(
                    index,
                    "title",
                    e.target.value
                  )
                }

              />



              <textarea

                className="
                w-full
                border
                p-3
                rounded-lg
                "

                rows={10}

                value={
                  chapter.content
                }

                onChange={
                  e=>
                  updateChapter(
                    index,
                    "content",
                    e.target.value
                  )
                }

              />


            </div>


          ))
        }




        <button

          onClick={addChapter}

          className="
          bg-gray-200
          px-5
          py-3
          rounded-lg
          mr-3
          "

        >

          + Add Chapter

        </button>




        <button

          onClick={saveBook}

          disabled={saving}

          className="
          bg-[#1F6F43]
          text-white
          px-5
          py-3
          rounded-lg
          mr-3
          "

        >

          {
            saving
            ?
            "Saving..."
            :
            "Save Book"
          }

        </button>




        <button

          onClick={publishBook}

          className="
          bg-blue-600
          text-white
          px-5
          py-3
          rounded-lg
          "

        >

          Publish

        </button>


      </div>


    </Layout>

  );

}