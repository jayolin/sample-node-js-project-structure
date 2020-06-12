
class SampleRepository {
  constructor({  }) {
    /**
     * Import variables from awilix container
     */
  }

  /**
   * Sample Repository Method
   */
  repositoryMethod() {
    return new Promise(async (resolve, reject) => {
      try {
        /**
         * Your custom implementation here
         */
        resolve({});
      } catch (error) {
        reject(error);
      }
    });
  }

}

export default SampleRepository;
