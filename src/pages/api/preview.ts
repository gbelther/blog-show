import { Document } from '@prismicio/client/types/documents';
import { NextApiRequest, NextApiResponse } from 'next';
import { getPrismicClient } from '../../services/prismic';

const linkResolver = (doc: Document): string => {
  if (doc.type === 'post') {
    return `/post/${doc.uid}`;
  }
  return '/';
};

const Preview = async (req: NextApiRequest, res: NextApiResponse) => {
  const { token: ref, documentId } = req.query;

  const redirectUrl = await getPrismicClient(req)
    .getPreviewResolver(ref as string, documentId as string)
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref });
  res.writeHead(302, { Location: `${redirectUrl}` });
  res.end();
};

export default Preview;
