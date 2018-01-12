# Edge Animate

>A lightweight polyfill for the Web Animations API. (WAAPI)

This project aims to provide a lightweight polyfill to WAAPI that leverages CSS Keyframes and does not use requestAnimationFrame.

## Contributions

Contributions are welcome.  Please create an [issue](https://github.com/notoriousb1t/edge-animate/issues) prior to adding a Pull Request.  See below on how to run this project locally.

### How to get the project running locally

- Install NodeJS / NPM
- Clone this project
- Run ```npm install``` in the directory
- Run ```npm start```.  This will build to the ```lib``` directory and simultaneously run all test files in the ```tests``` directory.

 > Alternately, run ```npm run test:watch``` to only watch tests, or ```npm run build:watch``` to only watch src files

### Structure of the project

| Folder | Description |
| --- | --- |
| /lib | Output for node |
| /lib.es2015 | Output as ES2015 modules |
| /src | Source files |
| /tests | Test files |
| /types | Output for TypeScript type definitions |

### Before you submit a Pull Request for code

- Submit an [issue](https://github.com/notoriousb1t/edge-animate/issues)
- Ensure at least one new unit test exists to cover the feature/bug
- Ensure new files are formatted property (4 space indentation)

## License

This library is licensed under MIT.