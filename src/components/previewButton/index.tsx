import Link from 'next/link';

import styles from './previewButton.module.scss';

export default function PreviewButton() {
  return (
    <div className={styles.containerButton}>
      <Link href="href=/api/exit-preview">
        <a>Sair do modo Preview</a>
      </Link>
    </div>
  );
}
