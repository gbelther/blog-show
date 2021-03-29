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

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Post {
  first_publication_date: string | null;
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

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
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

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
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
    },
    redirect: 60 * 30,
  };
};
