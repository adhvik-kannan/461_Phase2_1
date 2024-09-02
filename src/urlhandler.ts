class urlhandler{
    private url: URL;

    constructor(url: string){
        try{
        this.url = new URL(url);
        } catch(error){
            throw new Error('Invalid URL');
        }
    }

}
