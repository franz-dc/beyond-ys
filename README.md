<!-- markdownlint-disable-next-line -->
<img width="150" src="/public/assets/logo.png" alt="Beyond Ys logo">

# Beyond Ys

A fan website dedicated to [Nihon Falcom](https://www.falcom.co.jp)'s works. You can find information about Falcom's games, characters, music, staff, and more!

## Demo

You can visit the demo site [here](https://beyond-ys.vercel.app).

## Features

- **Music player**: Listen to your favorite Falcom music while browsing the site.
- **Responsive design**: Built with mobile devices in mind.

## Technologies Used

- [Next.js](https://nextjs.org): React framework for server-side rendering and static site generation.
- [Firebase](https://firebase.google.com): Comprehensive development platform providing authentication, real-time database, and hosting services.
- [MUI](https://mui.com): React UI framework for building responsive web applications.
- [Vercel](https://vercel.com): Cloud platform for static sites and serverless functions.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/download/)
- [Firebase project](https://firebase.google.com/docs/web/setup) or [Local Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite/install_and_configure)

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/franz-dc/beyond-ys.git
   ```

2. Install dependencies:

   ```sh
   npm i
   # or
   yarn
   ```

3. Create `.env.local` by copying `.env` and replace the values with your own:

   ```sh
   cp .env .env.local
   ```

4. Set up your **Firebase project** or **Firebase Local Emulator Suite**.

   a. **Firebase Project**

   1. Make sure that `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` is set to `false` in `.env.local`.

   2. Create a service account and download the JSON file.

   3. Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of the JSON file in `.env.local`.

   4. Make your storage bucket publicly readable. For more information, see [this](https://stackoverflow.com/a/61129057).

   b. **Firebase Local Emulator Suite**

   1. Make sure that `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` is set to `true` in `.env.local`.

   2. Enable the following services in your Firebase project:

      - Authentication
      - Firestore
      - Storage

   3. Update Firestore emulator variables in `.env.local` if necessary. This is only needed if you're using a different host or port.

   4. Run the following commands on your local Firebase directory to start the emulators:

      First time:

      ```sh
      firebase emulators:start --export-on-exit=./emulator-data
      ```

      Subsequent times:

      ```sh
      firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data
      ```

      This is needed to persist the data in the emulator and avoid having to reseed the database every time you restart the emulator.

5. Run this command to seed the database with sample data\*:

   ```sh
   npm run seed
   # or
   yarn seed
   ```

6. Run the development server:

   ```sh
   npm run dev
   # or
   yarn dev
   ```

7. Open [localhost:9000](http://localhost:9000) on your browser.

\* _Only canon Ys games are seeded (with some of their characters, music, and staff)._

## Contributing

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and ensure they're properly tested.
4. Commit your changes and push them to your forked repository.
5. Submit a pull request, explaining the changes you've made.

## License

This project is licensed under the [MIT License](https://github.com/franz-dc/beyond-ys/blob/main/LICENSE).
