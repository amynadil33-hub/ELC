import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";


interface Book {

  id:string;
  title:string;
  description:string;
  published:boolean;
  cover_url:string;
  pdf_url:string;

}



export default function MyBooks(){

  const [books,setBooks] = useState<Book[]>([]);
  const [loading,setLoading] = useState(true);

  const navigate = useNavigate();



  useEffect(()=>{

    loadBooks();

  },[]);





  async function loadBooks(){


    const {
      data:{user}
    } = await supabase.auth.getUser();



    if(!user){

      navigate("/login");
      return;

    }



    const {
      data,
      error
    } = await supabase

      .from("books")

      .select("*")

      .eq(
        "author_email",
        user.email
      )

      .order(
        "created_at",
        {
          ascending:false
        }
      );



    if(error){

      console.error(error);
      return;

    }


    setBooks(
      data || []
    );


    setLoading(false);


  }





  async function deleteBook(id:string){

  const confirmDelete = confirm(
    "Delete this book and all chapters?"
  );

  if(!confirmDelete) return;


  // Delete chapters first
  const { error: chapterError } = await supabase
    .from("chapters")
    .delete()
    .eq(
      "book_id",
      id
    );


  if(chapterError){

    alert(chapterError.message);
    return;

  }



  // Delete book
  const { error } = await supabase
    .from("books")
    .delete()
    .eq(
      "id",
      id
    );


  if(error){

    alert(error.message);
    return;

  }


  alert("Book deleted");


  loadBooks();

}





  if(loading){

    return (

      <Layout>

        <div className="p-10 text-center">
          Loading books...
        </div>

      </Layout>

    );

  }





  return (

    <Layout>


      <div className="
      max-w-6xl
      mx-auto
      p-6
      ">


        <div className="flex justify-between items-center mb-8">


          <h1 className="
          text-3xl
          font-bold
          text-[#1F6F43]
          ">
            My Books
          </h1>


          <button

            onClick={() =>
              navigate("/create-book")
            }

            className="
            bg-[#1F6F43]
            text-white
            px-5
            py-3
            rounded-lg
            "
          >
            + New Book
          </button>


        </div>





        {
          books.length===0 ?

          (

            <div className="
            text-center
            py-20
            text-gray-500
            ">

              No books created yet.

            </div>

          )

          :

          (

          <div className="
          grid
          md:grid-cols-3
          gap-6
          ">


          {
            books.map(book=>(


              <div

                key={book.id}

                className="
                bg-white
                rounded-xl
                shadow
                overflow-hidden
                "
              >


                <img

                  src={
                    book.cover_url ||
                    "/images/ebook-placeholder.jpg"
                  }

                  className="
                  w-full
                  h-64
                  object-cover
                  "

                />



                <div className="p-5">


                  <h2 className="
                  text-xl
                  font-bold
                  text-[#1F6F43]
                  ">
                    {book.title}
                  </h2>



                  <p className="
                  text-sm
                  mt-2
                  ">
                    Status:

                    <span className="
                    font-bold
                    ml-2
                    ">

                    {
                      book.published
                      ?
                      "Published"
                      :
                      "Draft"
                    }

                    </span>

                  </p>




                  <div className="
                  flex
                  gap-2
                  mt-5
                  ">


                    <button

                      onClick={() =>
                        navigate(
                          `/edit-book/${book.id}`
                        )
                      }

                      className="
                      flex-1
                      bg-gray-200
                      py-2
                      rounded-lg
                      "
                    >
                      Edit
                    </button>



                    {
                      book.published && (

                      <button

                        onClick={() =>
                          navigate(
                            `/book/${book.id}`
                          )
                        }

                        className="
                        flex-1
                        bg-[#1F6F43]
                        text-white
                        py-2
                        rounded-lg
                        "
                      >
                        View
                      </button>

                      )

                    }



                  </div>



                  <button

                    onClick={() =>
                      deleteBook(book.id)
                    }

                    className="
                    mt-3
                    w-full
                    bg-red-500
                    text-white
                    py-2
                    rounded-lg
                    "
                  >

                    Delete

                  </button>



                </div>


              </div>


            ))
          }


          </div>

          )

        }



      </div>


    </Layout>

  );

}