import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Header from '../../components/Header';
import Link from 'next/link';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Comments from '../../components/Comments';
import PreviewButton from '../../components/previewButton';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface neighborPost {
  title: string;
  uid: string;
}

interface PostProps {
  post: Post;
  previousPost: neighborPost;
  nextPost: neighborPost;
  preview: boolean;
}

export default function Post({
  post,
  nextPost,
  previousPost,
  preview,
}: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const wordsAmountBody = RichText.asText(
    post.data.content.reduce((acc, curr) => [...acc, ...curr.body], [])
  ).split(' ').length;

  const wordsAmountHeading = post.data.content.reduce((acc, curr) => {
    if (curr.heading) {
      return [...acc, curr.heading.split(' ')];
    }

    return [...acc];
  }, []).length;

  const readingTime = Math.ceil((wordsAmountHeading + wordsAmountBody) / 200);

  return (
    <>
      <Head>
        <title>Post | Blog-show</title>
      </Head>

      <section className={styles.header}>
        <Header />
      </section>

      {post.data.banner.url && (
        <section className={styles.banner}>
          <img src={post.data.banner.url} alt="Banner" />
        </section>
      )}

      <main className={styles.container}>
        <div>
          <div className={styles.content}>
            <div className={styles.infoWrapper}>
              <p>{post.data.title}</p>
              <div>
                <span>
                  <FiCalendar />{' '}
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    { locale: ptBR }
                  )}
                </span>
                <span>
                  <FiUser /> {post.data.author}
                </span>
                <span>
                  <FiClock /> {readingTime} min
                </span>
              </div>
              <div>
                <span>
                  {/* {format(
                    parseISO(post.last_publication_date),
                    "'*editado em' dd MMM yyyy' às' HH:mm",
                    { locale: ptBR }
                  )} */}
                </span>
              </div>
            </div>
            {post.data.content.map(({ heading, body }) => (
              <div key={heading} className={styles.contentWrapper}>
                <h2>{heading}</h2>
                <div
                  className={styles.bodyWrapper}
                  dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }}
                ></div>
              </div>
            ))}
          </div>
          <aside className={styles.navegationPosts}>
            <div className={styles.previousPost}>
              {previousPost && (
                <>
                  <p>{previousPost.title}</p>
                  <Link href={`/post/${previousPost.uid}`}>
                    <a>Post Anterior</a>
                  </Link>
                </>
              )}
            </div>

            <div className={styles.nextPost}>
              {nextPost && (
                <>
                  <p>{nextPost.title}</p>
                  <Link href={`/post/${nextPost.uid}`}>
                    <a>Próximo post</a>
                  </Link>
                </>
              )}
            </div>
          </aside>

          <Comments />

          {preview && <PreviewButton />}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { pageSize: 3 }
  );

  const paths = posts.results.map(result => {
    return {
      params: {
        slug: result.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

function neighborPost(post, slug): neighborPost | null {
  if (slug === post.results[0].uid) {
    return null;
  } else {
    return {
      title: post.results[0]?.data?.title,
      uid: post.results[0]?.uid,
    };
  }
}

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  console.log(previewData);

  const prismic = getPrismicClient();

  let response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const resPreviousPost = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: slug,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const previousPost = neighborPost(resPreviousPost, slug);

  const resNextPost = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: slug,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = neighborPost(resNextPost, slug);

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: response.data.banner,
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
      previousPost,
      nextPost,
      preview,
    },
    revalidate: 60 * 30,
  };
};
