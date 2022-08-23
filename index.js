const { on } = require("events");
const { 
    LinkedinScraper,
    relevanceFilter,
    timeFilter,
    typeFilter,
    experienceLevelFilter,
    events,
} = require("linkedin-jobs-scraper");
const objectsToCsv = require('objects-to-csv');
const fs = require('fs');


(async () => {

    const jobPosts = [];

    // Each scraper instance is associated with one browser.
    // Concurrent queries will run on different pages within the same browser instance.
    const scraper = new LinkedinScraper({
        headless: true,
        slowMo: 1000,
        args: [
            "--lang=en-US",
        ],
    });

    // Add listeners for scraper events
    
    // Emitted once for each processed job
    scraper.on(events.scraper.data, (data) => {
        const jobData = {
            Query: `${data.query}`,
            Location: `${data.location}`,
            Id: `${data.jobId}`,
            Title: `${data.title}`,
            Company: `${data.company ? data.company : "N/A"}`,
            CompanyLink: `${data.companyLink ? data.companyLink : "N/A"}`,
            CompanyImgLink: `${data.companyImgLink ? data.companyImgLink : "N/A"}`,
            Place: `${data.place}`,
            Date: `${data.date}`,
            Link: `${data.link}`,
            applyLink: `${data.applyLink ? data.applyLink : "N/A"}`,
            insights: `${data.insights}`,
        }
        console.log(
            data.description.length,
            data.descriptionHTML.length,
            jobData
        );
        jobPosts.push(jobData);
    });
    
    // Emitted once for each scraped page
    scraper.on(events.scraper.metrics, (metrics) => {
        console.log(`Processed=${metrics.processed}`, `Failed=${metrics.failed}`, `Missed=${metrics.missed}`);        
    });

    scraper.on(events.scraper.error, (err) => {
        console.error(err);
    });

    scraper.on(events.scraper.end, () => {
        console.log('All done!');

        const filename = './jobs.csv';
        if (fs.existsSync(filename)) {
            new objectsToCsv(jobPosts).toDisk(filename, { append: true });
        }
        else {
            new objectsToCsv(jobPosts).toDisk(filename);
        }
        
    });

    // Custom function executed on browser side to extract job description [optional]
    const descriptionFn = () => document.querySelector(".jobs-description")
        .innerText
        .replace(/[\s\n\r]+/g, " ")
        .trim();

    // Run queries concurrently    
    await Promise.all([
        // Run queries serially
        scraper.run([
            {
                query: "testing, automation",
                options: {
                    locations: ["United States"], // This will override global options ["Europe"]
                    filters: {
                        type: [typeFilter.FULL_TIME, typeFilter.CONTRACT]    
                    },       
                }                                                       
            },
            // {
            //     query: "Sales",
            //     options: {                    
            //         limit: 10, // This will override global option limit (33)
            //         applyLink: false, // Try to extract apply link. Default to true.
            //         descriptionFn: descriptionFn, // Custom job description processor
            //     }
            // },
        ], { // Global options, will be merged individually with each query options
            locations: ["Europe"],
            limit: 30,
        }),
    ]);

    // Close browser
    await scraper.close();
})();
