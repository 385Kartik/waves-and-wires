import React from 'react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2.5">
    <h2 className="text-lg sm:text-xl font-bold text-[#111827]">{title}</h2>
    <div className="text-sm sm:text-[15px] text-[#374151] leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-10 lg:px-14 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-black text-[#111827] mb-8">Privacy Policy</h1>

      <div className="space-y-7">
        <Section title="Who we are">
          <p>
            Our website address is:{' '}
            <a href="https://wavesandwires.in" className="text-[#d97706] hover:underline font-medium">
              https://wavesandwires.in
            </a>
          </p>
        </Section>

        <Section title="Comments">
          <p>
            When visitors leave comments on the site we collect the data shown in the comments form, and also the visitor’s IP address and browser user agent string to help spam detection. An anonymized string created from your email address (also called a hash) may be provided to the Gravatar service to see if you are using it. The Gravatar service privacy policy is available here:{' '}
            <a
              href="https://automattic.com/privacy/"
              className="text-[#d97706] hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://automattic.com/privacy/
            </a>
            . After approval of your comment, your profile picture is visible to the public in the context of your comment.
          </p>
        </Section>

        <Section title="Media">
          <p>
            If you upload images to the website, you should avoid uploading images with embedded location data (EXIF GPS) included. Visitors to the website can download and extract any location data from images on the website.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            If you leave a comment on our site you may opt-in to saving your name, email address and website in cookies. These are for your convenience so that you do not have to fill in your details again when you leave another comment. These cookies will last for one year. If you visit our login page, we will set a temporary cookie to determine if your browser accepts cookies. This cookie contains no personal data and is discarded when you close your browser. When you log in, we will also set up several cookies to save your login information and your screen display choices. Login cookies last for two days, and screen options cookies last for a year. If you select “Remember Me”, your login will persist for two weeks. If you log out of your account, the login cookies will be removed. If you edit or publish an article, an additional cookie will be saved in your browser. This cookie includes no personal data and simply indicates the post ID of the article you just edited. It expires after 1 day.
          </p>
        </Section>

        <Section title="Embedded content from other websites">
          <p>
            When visitors leave comments on the site we collect the data shown in the comments form, and also the visitor’s IP address and browser user agent string to help spam detection. Suggested text: Articles on this site may include embedded content (e.g. videos, images, articles, etc.). Embedded content from other websites behaves in the exact same way as if the visitor has visited the other website. These websites may collect data about you, use cookies, embed additional third-party tracking, and monitor your interaction with that embedded content, including tracking your interaction with the embedded content if you have an account and are logged in to that website.
          </p>
        </Section>

        <Section title="Who we share your data with">
          <p>
            If you request a password reset, your IP address will be included in the reset email.
          </p>
        </Section>

        <Section title="How long we retain your data">
          <p>
            If you leave a comment, the comment and its metadata are retained indefinitely. This is so we can recognize and approve any follow-up comments automatically instead of holding them in a moderation queue. For users that register on our website (if any), we also store the personal information they provide in their user profile. All users can see, edit, or delete their personal information at any time (except they cannot change their username). Website administrators can also see and edit that information.
          </p>
        </Section>

        <Section title="What rights you have over your data">
          <p>
            If you have an account on this site, or have left comments, you can request to receive an exported file of the personal data we hold about you, including any data you have provided to us. You can also request that we erase any personal data we hold about you. This does not include any data we are obliged to keep for administrative, legal, or security purposes.
          </p>
        </Section>

        <Section title="Where we send your data">
          <p>
            Visitor comments may be checked through an automated spam detection service.
          </p>
        </Section>
      </div>
    </div>
  );
}