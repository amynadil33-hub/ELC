import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";


interface Chapter {
  id: string;
  title: string;
  content: string;
  chapter_order: number;
}


interface Book {
  id: string;
  title: string;
  description: string;
  author_name: string;
  pdf_url: string;
}



export default function BookReader(){

  const { id } = useParams();

  const [book,setBook] = useState<Book | null>(null);
  const [chapters,setChapters] = useState<Chapter[]>([]);
  const [loading,setLoading] = useState(true);



  useEffect(()=>{

    if(id){
      loadBook();
    }

  },[id]);





  async function loadBook(){

    const {
      data:bookData,
      error:bookError
    } = await supabase

      .from("books")

      .select("*")

      .eq("id",id)

      .single();



    if(bookError){

      console.error(bookError);
      return;

    }


    setBook(bookData);



    const {
      data:chapterData,
      error:chapterError
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



    if(chapterError){

      console.error(chapterError);

    }


    setChapters(
      chapterData || []
    );


    setLoading(false);

  }





  if(loading){

    return (

      <Layout>

        <div className="p-10 text-center">
          Loading book...
        </div>

      </Layout>

    );

  }





  return (

    <Layout>

      <div className="
      max-w-4xl
      mx-auto
      p-6
      ">


        <h1 className="
        text-4xl
        font-bold
        text-[#1F6F43]
        mb-3
        ">
          {book?.title}
        </h1>


        <p className="text-gray-600 mb-6">
          By {book?.author_name}
        </p>



        {book?.pdf_url && (

          <a

            href={book.pdf_url}

            target="_blank"

            className="
            inline-block
            bg-[#1F6F43]
            text-white
            px-6
            py-3
            rounded-lg
            mb-8
            "
          >

            Open PDF

          </a>

        )}




        <div className="
        space-y-8
        ">


        {
          chapters.map(
            (chapter,index)=>(

              <article
                key={chapter.id}
                className="
                bg-white
                shadow
                rounded-xl
                p-6
                "
              >

                <h2 className="
                text-2xl
                font-bold
                text-[#1F6F43]
                mb-4
                ">
                  Chapter {index+1}: {chapter.title}
                </h2>


                <p className="
                whitespace-pre-line
                text-gray-700
                leading-relaxed
                ">
                  {chapter.content}
                </p>


              </article>

            )
          )
        }


        </div>


      </div>


    </Layout>

  );

}